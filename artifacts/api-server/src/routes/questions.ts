import { Router, type IRouter } from "express";
import { GetQuestionsResponse } from "@workspace/api-zod";

type XaiPost = {
  text: string;
  authorName: string;
  authorUsername: string;
  url: string;
  createdAt: string | null;
  context: string;
};

type XaiRoundResponse = {
  posts?: XaiPost[];
};

type XaiResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  output_text?: string;
};

type XaiErrorResponse = {
  error?: string | {
    message?: string;
    type?: string;
    code?: string;
  };
  message?: string;
  detail?: string;
};

class XApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "XApiError";
  }
}

const router: IRouter = Router();
const searchQuery =
  "Search X for recent, high-engagement public posts from widely followed Kenyan public figures and recognizable Kenyan voices. Prioritize journalists, creators, athletes, entertainers, business leaders, civic voices, organizations, and other popular accounts discussing Kenya, Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, or coastal and western Kenya. Exclude retweets, replies, posts that are mostly links, obscure low-engagement accounts, and posts without a clearly identifiable public author.";
const cacheTtlMs = 5 * 60 * 1000;
const xaiModel = process.env.XAI_MODEL?.trim() || "grok-4.6";
const roundSchema = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "The exact text of the public X post, without rewriting." },
          authorName: { type: "string", description: "The author's public display name." },
          authorUsername: { type: "string", description: "The author's X username, without the @ symbol." },
          url: { type: "string", description: "The direct public x.com URL for this post." },
          createdAt: { type: ["string", "null"], description: "The post creation time in ISO 8601 format when available." },
          context: { type: "string", description: "A short factual label explaining the Kenya-related context." },
        },
        required: ["text", "authorName", "authorUsername", "url", "createdAt", "context"],
        additionalProperties: false,
      },
    },
  },
  required: ["posts"],
  additionalProperties: false,
} as const;
let cachedQuestions: {
  expiresAt: number;
  response: ReturnType<typeof GetQuestionsResponse.parse>;
} | null = null;

function buildQuestions(payload: XaiRoundResponse) {
  const usablePosts = (payload.posts ?? []).filter((post) => {
    const text = post.text.trim();
    let isXUrl = false;
    try {
      const url = new URL(post.url);
      isXUrl = (url.hostname === "x.com" || url.hostname === "twitter.com") && /\/status\/\d+/.test(url.pathname);
    } catch {
      isXUrl = false;
    }
    return Boolean(post.authorName.trim() && post.authorUsername.trim() && isXUrl && text.length >= 18 && text.length <= 280);
  });

  const uniqueAuthors = Array.from(
    new Map(
      usablePosts.map((post) => [`${post.authorUsername.toLowerCase()}`, post]),
    ).values(),
  );

  if (usablePosts.length < 5 || uniqueAuthors.length < 4) {
    throw new Error("X returned too few distinct public posts to build a round.");
  }

  const optionUsers = uniqueAuthors.slice(0, 4).map((post) => ({
    name: post.authorName.trim(),
    username: post.authorUsername.trim(),
  }));
  const formatAuthor = (author: { name: string; username: string }) => `${author.name} (@${author.username.replace(/^@/, "")})`;

  return usablePosts.slice(0, 5).map((post, index) => {
    const author = {
      name: post.authorName.trim(),
      username: post.authorUsername.trim().replace(/^@/, ""),
    };
    const answer = formatAuthor(author);
    const options = optionUsers.map((user) => formatAuthor(user));
    if (!options.includes(answer)) {
      options[0] = answer;
    }

    return {
      id: `xai-${index}-${author.username.toLowerCase()}`,
      quote: post.text.trim(),
      answer,
      options,
      context: post.context.trim() || `Live public post by @${author.username}`,
      tag: index === 4 ? "FINAL BOSS · LIVE X" : "LIVE ON X",
      difficulty: index === 4 ? "boss" : index >= 3 ? "hard" : index >= 1 ? "medium" : "easy",
      category: "public post",
      source: "live",
      sourceUrl: post.url,
      authorUsername: author.username,
      createdAt: post.createdAt,
    };
  });
}

function extractResponseText(payload: XaiResponse): string {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  const message = payload.output?.find((item) => item.type === "message");
  const content = message?.content?.find((item) => item.type === "output_text");
  if (!content?.text?.trim()) {
    throw new Error("xAI returned no structured question content.");
  }
  return content.text.trim();
}

router.get("/questions", async (req, res): Promise<void> => {
  if (cachedQuestions && cachedQuestions.expiresAt > Date.now()) {
    res.json(cachedQuestions.response);
    return;
  }

  try {
    const apiKey = process.env.XAI_API_KEY?.trim() || process.env.X_BEARER_TOKEN?.trim();
    if (!apiKey) {
      throw new XApiError(503, "xAI API key is not configured.");
    }

    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: xaiModel,
        input: [
          {
            role: "system",
            content:
              "You create a factual five-question quote guessing round. Use only public X posts returned by the X Search tool. Never invent, paraphrase, or combine posts. Return exactly five posts from five or more distinct, widely followed or clearly recognizable public authors so the game can build four answer options. Prioritize posts with strong visible engagement and well-known Kenyan public accounts over random or obscure accounts. Prefer posts from the last 7 days, but choose popularity and recognizability over strict recency when needed. Keep the exact post text and direct post URL. Do not include private accounts, retweets, replies, or posts that are mostly links.",
          },
          {
            role: "user",
            content: searchQuery,
          },
        ],
        tools: [{ type: "x_search" }],
        text: {
          format: {
            type: "json_schema",
            name: "kenya_x_question_round",
            schema: roundSchema,
            strict: true,
          },
        },
      }),
    });
    const responseText = await response.text();
    let payload: XaiResponse;
    try {
      payload = JSON.parse(responseText) as XaiResponse;
    } catch {
      payload = {};
    }
    if (!response.ok) {
      let providerMessage = "";
      try {
        const errorBody = JSON.parse(responseText) as XaiErrorResponse;
        providerMessage =
          (typeof errorBody.error === "string" ? errorBody.error : errorBody.error?.message) ||
          errorBody.message ||
          errorBody.detail ||
          "";
      } catch {
        providerMessage = "";
      }
      throw new XApiError(response.status, providerMessage || "xAI returned an unsuccessful response.");
    }

    const round = JSON.parse(extractResponseText(payload)) as XaiRoundResponse;
    const parsed = GetQuestionsResponse.parse({
      questions: buildQuestions(round),
      source: "live",
      refreshedAt: new Date().toISOString(),
    });
    cachedQuestions = { expiresAt: Date.now() + cacheTtlMs, response: parsed };
    res.json(parsed);
  } catch (error) {
    const status = error instanceof XApiError ? error.status : 503;
    const providerMessage = error instanceof Error ? error.message.toLowerCase() : "";
    const hasNoCredits = providerMessage.includes("credits") || providerMessage.includes("licenses");
    const message =
      status === 402 || hasNoCredits
        ? "xAI credits are currently depleted. Demo mode is available while they reset."
        : status === 401
          ? "xAI rejected the API key. Check that it is active and has access to the X Search tool."
          : status === 403
            ? "xAI denied access to X Search for this API project. Check the project and model permissions."
            : "Live X posts via xAI are temporarily unavailable. Demo mode is available.";
    req.log.warn({ status, providerMessage: error instanceof Error ? error.message : "Unknown error", err: error }, "Unable to build live X question round");
    res.status(503).json({ error: message });
  }
});

export default router;