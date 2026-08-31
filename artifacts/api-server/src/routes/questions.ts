import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { GetQuestionsResponse } from "@workspace/api-zod";

type XUser = {
  id: string;
  name: string;
  username: string;
};

type XTweet = {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
};

type XSearchResponse = {
  data?: XTweet[];
  includes?: {
    users?: XUser[];
  };
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
const connectors = new ReplitConnectors();
const searchQuery =
  "lang:en (Kenya OR Nairobi OR Mombasa OR Kisumu OR Nakuru OR Eldoret) -is:retweet -is:reply -has:links";
const cacheTtlMs = 5 * 60 * 1000;
let cachedQuestions: {
  expiresAt: number;
  response: ReturnType<typeof GetQuestionsResponse.parse>;
} | null = null;

function buildQuestions(payload: XSearchResponse) {
  const users = new Map((payload.includes?.users ?? []).map((user) => [user.id, user]));
  const usableTweets = (payload.data ?? []).filter((tweet) => {
    const author = tweet.author_id ? users.get(tweet.author_id) : undefined;
    const text = tweet.text.trim();
    return Boolean(author?.name && author.username && text.length >= 18 && text.length <= 280);
  });

  const uniqueAuthors = Array.from(
    new Map(
      usableTweets
        .map((tweet) => (tweet.author_id ? users.get(tweet.author_id) : undefined))
        .filter((user): user is XUser => Boolean(user))
        .map((user) => [user.id, user]),
    ).values(),
  );

  if (usableTweets.length < 5 || uniqueAuthors.length < 4) {
    throw new Error("X returned too few distinct public posts to build a round.");
  }

  const optionUsers = uniqueAuthors.slice(0, 4);
  return usableTweets.slice(0, 5).map((tweet, index) => {
    const author = users.get(tweet.author_id!);
    if (!author) {
      throw new Error("A returned X post had no public author.");
    }

    const answer = author.name;
    const options = optionUsers.map((user) => user.name);
    if (!options.includes(answer)) {
      options[0] = answer;
    }

    return {
      id: `x-${tweet.id}`,
      quote: tweet.text.trim(),
      answer,
      options,
      context: `Live public post by @${author.username}`,
      tag: index === 4 ? "FINAL BOSS · LIVE X" : "LIVE ON X",
      difficulty: index === 4 ? "boss" : index >= 3 ? "hard" : index >= 1 ? "medium" : "easy",
      category: "public post",
      source: "live",
      sourceUrl: `https://x.com/${author.username}/status/${tweet.id}`,
      authorUsername: author.username,
      createdAt: tweet.created_at ?? null,
    };
  });
}

router.get("/questions", async (req, res): Promise<void> => {
  if (cachedQuestions && cachedQuestions.expiresAt > Date.now()) {
    res.json(cachedQuestions.response);
    return;
  }

  const params = new URLSearchParams({
    query: searchQuery,
    max_results: "25",
    "tweet.fields": "created_at,author_id,lang",
    expansions: "author_id",
    "user.fields": "name,username",
  });

  try {
    const response = await connectors.proxy("x", `/2/tweets/search/recent?${params.toString()}`);
    const payload = (await response.json()) as XSearchResponse;
    if (!response.ok) {
      throw new XApiError(response.status, "X returned an unsuccessful response.");
    }

    const parsed = GetQuestionsResponse.parse({
      questions: buildQuestions(payload),
      source: "live",
      refreshedAt: new Date().toISOString(),
    });
    cachedQuestions = { expiresAt: Date.now() + cacheTtlMs, response: parsed };
    res.json(parsed);
  } catch (error) {
    const status = error instanceof XApiError ? error.status : 503;
    const message =
      status === 402
        ? "X API credits are currently depleted. Demo mode is available while they reset."
        : "Live X posts are temporarily unavailable. Demo mode is available.";
    req.log.warn({ status, err: error }, "Unable to build live X question round");
    res.status(503).json({ error: message });
  }
});

export default router;