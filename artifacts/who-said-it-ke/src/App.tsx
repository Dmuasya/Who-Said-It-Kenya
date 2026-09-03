import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { KENYA_X_POSTS } from './data/kenyaXPosts';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Home as HomeIcon,
  Lightbulb,
  Lock,
  Medal,
  MessageCircle,
  RotateCcw,
  ExternalLink,
  Radio,
  Share2,
  Shield,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';

type View = 'home' | 'play' | 'leaders' | 'profile' | 'share';
type Phase = 'countdown' | 'question' | 'reveal' | 'finished';
type ResultKind = 'correct' | 'wrong' | 'timeout';
type ContentSource = 'curated' | 'demo';
type GameModeId = 'quickfire' | 'classic' | 'marathon';
type GameMode = {
  id: GameModeId;
  label: string;
  questionCount: number;
  totalSeconds: number;
  secondsPerQuestion: number;
  description: string;
  signature?: boolean;
};

const GAME_MODES: GameMode[] = [
  { id: 'quickfire', label: 'Quickfire', questionCount: 5, totalSeconds: 50, secondsPerQuestion: 10, description: 'The signature five-question group challenge.', signature: true },
  { id: 'classic', label: 'Classic', questionCount: 10, totalSeconds: 90, secondsPerQuestion: 9, description: 'A longer round for sharper pattern-spotting.' },
  { id: 'marathon', label: 'Marathon', questionCount: 25, totalSeconds: 180, secondsPerQuestion: 7.2, description: 'Twenty-five posts. Three minutes. Stay locked in.' },
];

function getGameMode(id: GameModeId) {
  return GAME_MODES.find((mode) => mode.id === id) || GAME_MODES[0];
}

function formatModeDuration(totalSeconds: number) {
  return totalSeconds >= 60 ? `${Math.floor(totalSeconds / 60)} min${totalSeconds % 60 ? ` ${totalSeconds % 60} sec` : ''}` : `${totalSeconds} seconds`;
}

type Question = {
  id: string;
  quote: string;
  answer: string;
  options: string[];
  context: string;
  tag: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  category: string;
  source?: ContentSource;
  sourceUrl?: string | null;
  authorUsername?: string | null;
  createdAt?: string | null;
};

type AnswerRecord = {
  selected: number | null;
  correct: boolean;
  points: number;
  time: number;
  kind: ResultKind;
};

function buildCuratedQuestions() {
  const uniqueAuthors = Array.from(new Map(KENYA_X_POSTS.map((post) => [post.authorUsername.toLowerCase(), post])).values());
  const optionUsers = uniqueAuthors.slice(0, 4);
  const formatAuthor = (author: { authorName: string; authorUsername: string }) => `${author.authorName} (@${author.authorUsername.replace(/^@/, '')})`;

  return KENYA_X_POSTS.map((post, index) => {
    const answer = formatAuthor(post);
    const options = optionUsers.map(formatAuthor);
    if (!options.includes(answer)) options[0] = answer;
    return {
      id: `curated-${index}-${post.authorUsername}`,
      quote: post.text,
      answer,
      options,
      context: post.context,
      tag: index === KENYA_X_POSTS.length - 1 ? 'FINAL BOSS · CURATED X' : 'CURATED X POST',
      difficulty: index >= KENYA_X_POSTS.length - 5 ? 'hard' : index >= 8 ? 'medium' : 'easy',
      category: 'public post',
      source: 'curated' as const,
      sourceUrl: post.url,
      authorUsername: post.authorUsername,
      createdAt: null,
    } satisfies Question;
  });
}

const QUESTIONS: Question[] = [
  {
    id: 'q001',
    quote: '“If the matatu is moving, the meeting has already started.”',
    answer: 'Hon. Wanjiku Mbele',
    options: ['Hon. Wanjiku Mbele', 'Sen. Kato Njoroge', 'Dr. Amani Wekesa', 'Mzee Baraka Tambo'],
    context: 'A fictional campaign stop in Kasarani',
    tag: 'CITY RHYTHM',
    difficulty: 'easy',
    category: 'funny',
  },
  {
    id: 'q002',
    quote: '“A budget is just a to-do list wearing a very serious tie.”',
    answer: 'Dr. Amani Wekesa',
    options: ['Mzee Baraka Tambo', 'Dr. Amani Wekesa', 'Hon. Wanjiku Mbele', 'Sen. Kato Njoroge'],
    context: 'A fictional committee hearing in Nairobi',
    tag: 'THE PAPERWORK',
    difficulty: 'easy',
    category: 'governance',
  },
  {
    id: 'q003',
    quote: '“You cannot promise sunshine then hide the umbrella.”',
    answer: 'Sen. Kato Njoroge',
    options: ['Sen. Kato Njoroge', 'Dr. Amani Wekesa', 'Mzee Baraka Tambo', 'Hon. Wanjiku Mbele'],
    context: 'A fictional town hall in Kisumu',
    tag: 'BIG PROMISES',
    difficulty: 'medium',
    category: 'promises',
  },
  {
    id: 'q004',
    quote: '“The people want results, not another committee about results.”',
    answer: 'Mzee Baraka Tambo',
    options: ['Hon. Wanjiku Mbele', 'Mzee Baraka Tambo', 'Sen. Kato Njoroge', 'Dr. Amani Wekesa'],
    context: 'A fictional public forum in Mombasa',
    tag: 'STRAIGHT TALK',
    difficulty: 'hard',
    category: 'accountability',
  },
  {
    id: 'q005',
    quote: '“Leadership is knowing when to listen, and when to lower the microphone.”',
    answer: 'Hon. Wanjiku Mbele',
    options: ['Dr. Amani Wekesa', 'Sen. Kato Njoroge', 'Hon. Wanjiku Mbele', 'Mzee Baraka Tambo'],
    context: 'A fictional national debate final',
    tag: 'FINAL BOSS',
    difficulty: 'boss',
    category: 'debate',
  },
  {
    id: 'q006',
    quote: '“The loudest slogan still needs a quiet plan behind it.”',
    answer: 'Dr. Amani Wekesa',
    options: ['Dr. Amani Wekesa', 'Hon. Wanjiku Mbele', 'Mzee Baraka Tambo', 'Sen. Kato Njoroge'],
    context: 'A fictional policy breakfast in Eldoret',
    tag: 'QUIET PLANS',
    difficulty: 'easy',
    category: 'policy',
  },
  {
    id: 'q007',
    quote: '“A promise without a timeline is just a very confident wish.”',
    answer: 'Sen. Kato Njoroge',
    options: ['Mzee Baraka Tambo', 'Sen. Kato Njoroge', 'Dr. Amani Wekesa', 'Hon. Wanjiku Mbele'],
    context: 'A fictional youth forum in Nakuru',
    tag: 'THE FINE PRINT',
    difficulty: 'easy',
    category: 'promises',
  },
  {
    id: 'q008',
    quote: '“When the microphone fails, the ideas should still work.”',
    answer: 'Mzee Baraka Tambo',
    options: ['Hon. Wanjiku Mbele', 'Dr. Amani Wekesa', 'Mzee Baraka Tambo', 'Sen. Kato Njoroge'],
    context: 'A fictional civic day in Nyeri',
    tag: 'NO SOUND',
    difficulty: 'medium',
    category: 'debate',
  },
  {
    id: 'q009',
    quote: '“Every shortcut has a toll booth somewhere.”',
    answer: 'Hon. Wanjiku Mbele',
    options: ['Sen. Kato Njoroge', 'Hon. Wanjiku Mbele', 'Mzee Baraka Tambo', 'Dr. Amani Wekesa'],
    context: 'A fictional transport summit in Thika',
    tag: 'SHORTCUTS',
    difficulty: 'medium',
    category: 'funny',
  },
  {
    id: 'q010',
    quote: '“A good speech should leave room for a better question.”',
    answer: 'Dr. Amani Wekesa',
    options: ['Dr. Amani Wekesa', 'Mzee Baraka Tambo', 'Sen. Kato Njoroge', 'Hon. Wanjiku Mbele'],
    context: 'A fictional lecture in Kakamega',
    tag: 'OPEN FLOOR',
    difficulty: 'medium',
    category: 'debate',
  },
  {
    id: 'q011',
    quote: '“If the numbers do not add up, add more honesty.”',
    answer: 'Sen. Kato Njoroge',
    options: ['Mzee Baraka Tambo', 'Dr. Amani Wekesa', 'Sen. Kato Njoroge', 'Hon. Wanjiku Mbele'],
    context: 'A fictional budget clinic in Machakos',
    tag: 'COUNTING ON IT',
    difficulty: 'medium',
    category: 'governance',
  },
  {
    id: 'q012',
    quote: '“A queue is a democracy with better manners.”',
    answer: 'Mzee Baraka Tambo',
    options: ['Mzee Baraka Tambo', 'Hon. Wanjiku Mbele', 'Dr. Amani Wekesa', 'Sen. Kato Njoroge'],
    context: 'A fictional service centre in Kitale',
    tag: 'IN LINE',
    difficulty: 'medium',
    category: 'funny',
  },
  {
    id: 'q013',
    quote: '“The plan is not late; it is taking the scenic route.”',
    answer: 'Hon. Wanjiku Mbele',
    options: ['Dr. Amani Wekesa', 'Hon. Wanjiku Mbele', 'Sen. Kato Njoroge', 'Mzee Baraka Tambo'],
    context: 'A fictional development launch in Meru',
    tag: 'SCENIC ROUTE',
    difficulty: 'hard',
    category: 'promises',
  },
  {
    id: 'q014',
    quote: '“A committee can solve anything except the question of when to finish.”',
    answer: 'Dr. Amani Wekesa',
    options: ['Sen. Kato Njoroge', 'Mzee Baraka Tambo', 'Dr. Amani Wekesa', 'Hon. Wanjiku Mbele'],
    context: 'A fictional assembly hallway in Kisii',
    tag: 'MEETING AGAIN',
    difficulty: 'hard',
    category: 'accountability',
  },
  {
    id: 'q015',
    quote: '“The best campaign vehicle is one that actually starts.”',
    answer: 'Sen. Kato Njoroge',
    options: ['Hon. Wanjiku Mbele', 'Sen. Kato Njoroge', 'Dr. Amani Wekesa', 'Mzee Baraka Tambo'],
    context: 'A fictional rally day in Garissa',
    tag: 'ON THE ROAD',
    difficulty: 'hard',
    category: 'funny',
  },
  {
    id: 'q016',
    quote: '“You can have ten talking points and still miss the point.”',
    answer: 'Mzee Baraka Tambo',
    options: ['Dr. Amani Wekesa', 'Mzee Baraka Tambo', 'Hon. Wanjiku Mbele', 'Sen. Kato Njoroge'],
    context: 'A fictional radio interview in Malindi',
    tag: 'THE POINT',
    difficulty: 'hard',
    category: 'debate',
  },
  {
    id: 'q017',
    quote: '“A handshake is not a policy document, however warm it feels.”',
    answer: 'Dr. Amani Wekesa',
    options: ['Dr. Amani Wekesa', 'Sen. Kato Njoroge', 'Mzee Baraka Tambo', 'Hon. Wanjiku Mbele'],
    context: 'A fictional roundtable in Nairobi',
    tag: 'READ THE ROOM',
    difficulty: 'hard',
    category: 'policy',
  },
  {
    id: 'q018',
    quote: '“The podium is borrowed, so make the message worth returning.”',
    answer: 'Hon. Wanjiku Mbele',
    options: ['Mzee Baraka Tambo', 'Hon. Wanjiku Mbele', 'Dr. Amani Wekesa', 'Sen. Kato Njoroge'],
    context: 'A fictional community hall in Bomet',
    tag: 'BORROWED TIME',
    difficulty: 'hard',
    category: 'debate',
  },
  {
    id: 'q019',
    quote: '“If everyone agrees instantly, someone forgot the important question.”',
    answer: 'Sen. Kato Njoroge',
    options: ['Sen. Kato Njoroge', 'Hon. Wanjiku Mbele', 'Mzee Baraka Tambo', 'Dr. Amani Wekesa'],
    context: 'A fictional public hearing in Homa Bay',
    tag: 'ONE MORE THING',
    difficulty: 'boss',
    category: 'accountability',
  },
  {
    id: 'q020',
    quote: '“The final word is useful only when the first action follows.”',
    answer: 'Mzee Baraka Tambo',
    options: ['Dr. Amani Wekesa', 'Sen. Kato Njoroge', 'Mzee Baraka Tambo', 'Hon. Wanjiku Mbele'],
    context: 'A fictional national debate final',
    tag: 'FINAL WORD',
    difficulty: 'boss',
    category: 'governance',
  },
];

function getDailyChallenge(date = new Date()) {
  const dateKey = date.toISOString().slice(0, 10);
  const seed = Array.from(dateKey).reduce((total, character) => total + character.charCodeAt(0), 0);
  const start = seed % (QUESTIONS.length - 4);
  return QUESTIONS.slice(start, start + 5);
}

function isYesterday(value: string | null) {
  if (!value) return false;
  const previous = new Date(value);
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  previous.setHours(0, 0, 0, 0);
  return previous.getTime() === yesterday.getTime();
}

const MOCK_LEADERS = [
  { name: 'Maya K.', score: 4420, streak: 12, initials: 'MK', color: 'coral' },
  { name: 'Brian O.', score: 4180, streak: 9, initials: 'BO', color: 'teal' },
  { name: 'Wanjiru N.', score: 3890, streak: 7, initials: 'WN', color: 'gold' },
  { name: 'Tomi A.', score: 3440, streak: 6, initials: 'TA', color: 'navy' },
  { name: 'Kevin M.', score: 3100, streak: 4, initials: 'KM', color: 'coral' },
];

const STORAGE = {
  name: 'wsi-ke-name',
  best: 'wsi-ke-best',
  bestStreak: 'wsi-ke-best-streak',
  streak: 'wsi-ke-streak',
  lastPlayed: 'wsi-ke-last-played',
  sound: 'wsi-ke-sound',
  totalPoints: 'wsi-ke-total-points',
  totalAnswered: 'wsi-ke-total-answered',
  totalCorrect: 'wsi-ke-total-correct',
  dailyCompleted: 'wsi-ke-daily-completed',
  demoScores: 'wsi-ke-demo-scores',
};

const readNumber = (key: string, fallback: number) => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

function playTone(kind: 'tick' | 'correct' | 'wrong' | 'win', enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { tick: 260, correct: 560, wrong: 145, win: 760 };
    oscillator.frequency.value = frequencies[kind];
    oscillator.type = kind === 'wrong' ? 'sawtooth' : 'triangle';
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === 'win' ? 0.12 : 0.07, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === 'win' ? 0.38 : 0.16));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.4);
    window.setTimeout(() => void context.close(), 500);
  } catch {
    // Sound is an enhancement. Browsers may block the AudioContext until a gesture.
  }
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function App() {
  const [location, setLocation] = useLocation();
  const pathView: View = location === '/leaders' ? 'leaders' : location === '/profile' ? 'profile' : location === '/challenge' ? 'share' : location === '/play' ? 'play' : 'home';
  const [view, setView] = useState<View>(pathView);
  const [name, setName] = useState(() => localStorage.getItem(STORAGE.name) || 'Nia');
  const [editingName, setEditingName] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(STORAGE.sound) !== 'off');
  const [bestScore, setBestScore] = useState(() => readNumber(STORAGE.best, 0));
  const [streak, setStreak] = useState(() => readNumber(STORAGE.streak, 3));
  const [bestStreak, setBestStreak] = useState(() => readNumber(STORAGE.bestStreak, 3));
  const [totalPoints, setTotalPoints] = useState(() => readNumber(STORAGE.totalPoints, 0));
  const [totalAnswered, setTotalAnswered] = useState(() => readNumber(STORAGE.totalAnswered, 0));
  const [totalCorrect, setTotalCorrect] = useState(() => readNumber(STORAGE.totalCorrect, 0));
  const [dailyCompleted, setDailyCompleted] = useState(() => localStorage.getItem(STORAGE.dailyCompleted) === new Date().toDateString());
  const curatedQuestions = buildCuratedQuestions();
  const [questionPool] = useState<Question[]>(() => curatedQuestions.length >= 5 ? curatedQuestions : getDailyChallenge());
  const [gameQuestions, setGameQuestions] = useState<Question[]>(() => curatedQuestions.slice(0, 5));
  const [contentSource] = useState<ContentSource>('curated');
  const [roundSource, setRoundSource] = useState<ContentSource>('curated');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('quickfire');
  const [roundMode, setRoundMode] = useState<GameModeId>('quickfire');
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getGameMode('quickfire').secondsPerQuestion);
  const [startedAt, setStartedAt] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [hintForQuestion, setHintForQuestion] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ResultKind | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const tickRef = useRef<number | null>(null);

  const syncView = useCallback((next: View) => {
    setView(next);
    const path = next === 'home' ? '/' : next === 'leaders' ? '/leaders' : next === 'profile' ? '/profile' : next === 'play' ? '/play' : '/challenge';
    setLocation(path);
  }, [setLocation]);

  useEffect(() => {
    setView(pathView);
  }, [pathView]);

  useEffect(() => {
    localStorage.setItem(STORAGE.name, name);
    localStorage.setItem(STORAGE.sound, soundOn ? 'on' : 'off');
    localStorage.setItem(STORAGE.best, String(bestScore));
    localStorage.setItem(STORAGE.bestStreak, String(bestStreak));
    localStorage.setItem(STORAGE.totalPoints, String(totalPoints));
    localStorage.setItem(STORAGE.totalAnswered, String(totalAnswered));
    localStorage.setItem(STORAGE.totalCorrect, String(totalCorrect));
  }, [bestScore, bestStreak, name, soundOn, totalAnswered, totalCorrect, totalPoints]);

  const currentQuestion = gameQuestions[questionIndex] || questionPool[0] || QUESTIONS[0];
  const correctCount = answerRecords.filter((record) => record.correct).length;
  const shareGrid = answerRecords.map((record) => (record.correct ? '🟩' : '🟥')).join('');
  const activeMode = getGameMode(roundMode);
  const gameShareText = `I scored ${score.toLocaleString()} points on Who Said It? Kenya — ${activeMode.label} mode.\n${shareGrid || '⬜'.repeat(activeMode.questionCount)} ${correctCount}/${activeMode.questionCount}\nCan you beat my score? #WhoSaidItKE`;

  const startGame = useCallback(() => {
    const mode = getGameMode(selectedMode);
    const sourceQuestions = questionPool.length >= 5 ? questionPool : getDailyChallenge();
    const questions = Array.from({ length: mode.questionCount }, (_, index) => {
      const question = sourceQuestions[index % sourceQuestions.length];
      return { ...question, id: `${question.id}-${mode.id}-${index}`, tag: index === mode.questionCount - 1 ? `FINAL BOSS · ${mode.label.toUpperCase()}` : question.tag, options: shuffle(question.options) };
    });
    setGameQuestions(questions);
    setRoundMode(selectedMode);
    setRoundSource(contentSource);
    setQuestionIndex(0);
    setAnswerRecords([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setSelected(null);
    setFeedback(null);
    setTimeLeft(mode.secondsPerQuestion);
    setUsedHint(false);
    setHintForQuestion(null);
    setShowQuitConfirm(false);
    setPhase('countdown');
    setCountdown(3);
    syncView('play');
  }, [contentSource, questionPool, selectedMode, syncView]);

  useEffect(() => {
    if (view !== 'play' || phase !== 'countdown') return;
    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(countdownTimer);
          setPhase('question');
          setSelected(null);
          setFeedback(null);
          setStartedAt(Date.now());
          return 0;
        }
        playTone('tick', soundOn);
        return current - 1;
      });
    }, 850);
    return () => window.clearInterval(countdownTimer);
  }, [view, phase, soundOn]);

  useEffect(() => {
    if (view !== 'play' || phase !== 'question') return;
    const mode = getGameMode(roundMode);
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, mode.secondsPerQuestion - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        answerQuestion(null);
      }
    }, 100);
    tickRef.current = timer;
    return () => window.clearInterval(timer);
  }, [roundMode, view, phase, startedAt]);

  const answerQuestion = useCallback((optionIndex: number | null) => {
    if (phase !== 'question') return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    const elapsed = Math.min(getGameMode(roundMode).secondsPerQuestion, Math.max(0, (Date.now() - startedAt) / 1000));
    const correct = optionIndex !== null && currentQuestion.options[optionIndex] === currentQuestion.answer;
    const kind: ResultKind = optionIndex === null ? 'timeout' : correct ? 'correct' : 'wrong';
    const bucketBonus = elapsed <= 2 ? 500 : elapsed <= 4 ? 400 : elapsed <= 6 ? 300 : elapsed <= 8 ? 200 : 100;
    const points = correct ? (hintForQuestion === questionIndex ? 500 : 500 + bucketBonus + Math.max(0, combo * 50)) : 0;
    const nextCombo = correct ? combo + 1 : 0;
    setSelected(optionIndex);
    setFeedback(kind);
    setTimeLeft(Math.max(0, getGameMode(roundMode).secondsPerQuestion - elapsed));
    setScore((current) => current + points);
    setCombo(nextCombo);
    setMaxCombo((current) => Math.max(current, nextCombo));
    setAnswerRecords((records) => [...records, { selected: optionIndex, correct, points, time: elapsed, kind }]);
    playTone(kind === 'correct' ? 'correct' : 'wrong', soundOn);
    setPhase('reveal');
  }, [combo, currentQuestion, hintForQuestion, phase, questionIndex, roundMode, soundOn, startedAt]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    const revealTimer = window.setTimeout(() => {
      if (questionIndex >= gameQuestions.length - 1) {
        const finalScore = score;
        setBestScore((oldBest) => {
          const nextBest = Math.max(oldBest, finalScore);
          localStorage.setItem(STORAGE.best, String(nextBest));
          return nextBest;
        });
        setTotalPoints((total) => total + finalScore);
        setTotalAnswered((total) => total + gameQuestions.length);
        setTotalCorrect((total) => total + answerRecords.filter((record) => record.correct).length);
        setDailyCompleted(true);
        localStorage.setItem(STORAGE.dailyCompleted, new Date().toDateString());
        try {
          const previousScores = JSON.parse(localStorage.getItem(STORAGE.demoScores) || '[]') as number[];
          localStorage.setItem(STORAGE.demoScores, JSON.stringify([...previousScores, finalScore].slice(-20)));
        } catch {
          localStorage.setItem(STORAGE.demoScores, JSON.stringify([finalScore]));
        }
        const playedDate = localStorage.getItem(STORAGE.lastPlayed);
        const today = new Date().toDateString();
        if (playedDate !== today) {
          const nextStreak = isYesterday(playedDate) ? streak + 1 : 1;
          setStreak(nextStreak);
          setBestStreak((oldBest) => Math.max(oldBest, nextStreak));
          localStorage.setItem(STORAGE.streak, String(nextStreak));
          localStorage.setItem(STORAGE.lastPlayed, today);
        }
        playTone('win', soundOn);
        setPhase('finished');
      } else {
        setQuestionIndex((current) => current + 1);
        setPhase('countdown');
        setCountdown(2);
        setTimeLeft(getGameMode(roundMode).secondsPerQuestion);
      }
    }, 1250);
    return () => window.clearTimeout(revealTimer);
  }, [gameQuestions.length, phase, questionIndex, roundMode, score, soundOn, streak]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (view !== 'play' || phase !== 'question') return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 4) answerQuestion(index);
      if (event.key.toLowerCase() === 'h') useHint();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const useHint = useCallback(() => {
    if (usedHint || phase !== 'question') return;
    setUsedHint(true);
    setHintForQuestion(questionIndex);
    playTone('tick', soundOn);
  }, [phase, questionIndex, soundOn, usedHint]);

  const goHome = () => {
    setShowQuitConfirm(false);
    syncView('home');
  };
  const requestQuit = () => {
    if (view === 'play' && phase !== 'finished') {
      setShowQuitConfirm(true);
      return;
    }
    goHome();
  };
  const navigate = useCallback((next: View) => {
    if (next === 'play' && phase === 'finished') {
      startGame();
      return;
    }
    syncView(next);
  }, [phase, startGame, syncView]);

  const submitName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextName = String(form.get('playerName') || '').trim().slice(0, 18);
    if (!nextName) {
      setSaveError('Give yourself a name before you save.');
      return;
    }
    setName(nextName);
    setSaveError('');
    setEditingName(false);
  };

  const shareResult = async () => {
    const navigatorWithShare = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };
    try {
      if (navigatorWithShare.share) {
        await navigatorWithShare.share({ title: 'Who Said It? Kenya', text: gameShareText });
        return;
      }
    } catch {
      // A dismissed share sheet is not an error to show to the player.
    }
    await copyResult();
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(gameShareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setSaveError('Could not copy automatically. Try selecting the result text.');
    }
  };

  const handleFallbackShare = (kind: 'whatsapp' | 'x') => {
    const encoded = encodeURIComponent(gameShareText);
    const url = kind === 'whatsapp' ? `https://wa.me/?text=${encoded}` : `https://x.com/intent/post?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="app-shell bg-[#f2efe6] text-[#183d41]">
      {view !== 'play' || phase === 'finished' ? (
        <Header view={view} name={name} source={view === 'play' ? roundSource : contentSource} soundOn={soundOn} setSoundOn={setSoundOn} onNavigate={navigate} />
      ) : null}
      <main>
        {view === 'home' && <HomeScreen name={name} streak={streak} bestScore={bestScore} dailyCompleted={dailyCompleted} source={contentSource} mode={getGameMode(selectedMode)} onModeChange={setSelectedMode} startGame={startGame} onNavigate={syncView} />}
        {view === 'play' && phase !== 'finished' && (
          <GameScreen
            phase={phase}
            countdown={countdown}
            question={currentQuestion}
            questionIndex={questionIndex}
            timeLeft={timeLeft}
            selected={selected}
            feedback={feedback}
            score={score}
            combo={combo}
            hintUsed={usedHint}
            hintForQuestion={hintForQuestion}
            mode={getGameMode(roundMode)}
            source={roundSource}
            onAnswer={answerQuestion}
            onHint={useHint}
            onQuit={requestQuit}
            lastPoints={answerRecords[answerRecords.length - 1]?.points ?? 0}
          />
        )}
        {view === 'play' && phase === 'finished' && (
          <ResultsScreen
            name={name}
            score={score}
            correctCount={correctCount}
            maxCombo={maxCombo}
            streak={streak}
            records={answerRecords}
            mode={activeMode}
            source={roundSource}
            shareText={gameShareText}
            copied={copied}
            onCopy={copyResult}
            onShare={shareResult}
            onWhatsapp={() => handleFallbackShare('whatsapp')}
            onX={() => handleFallbackShare('x')}
            onChallenge={() => syncView('share')}
            onPlayAgain={startGame}
            onHome={goHome}
          />
        )}
        {view === 'leaders' && <LeadersScreen name={name} score={bestScore} streak={streak} onPlay={startGame} />}
        {view === 'profile' && (
          <ProfileScreen
            name={name}
            initials={initials(name)}
            bestScore={bestScore}
            streak={streak}
            editing={editingName}
            setEditing={setEditingName}
            onSubmit={submitName}
            saveError={saveError}
            onPlay={startGame}
            totalPoints={totalPoints}
            totalCorrect={totalCorrect}
            totalAnswered={totalAnswered}
            bestStreak={bestStreak}
          />
        )}
        {view === 'share' && (
          <ChallengeScreen
            name={name}
            mode={activeMode}
            shareText={gameShareText}
            source={roundSource}
            onShare={shareResult}
            onCopy={copyResult}
            onWhatsapp={() => handleFallbackShare('whatsapp')}
            onX={() => handleFallbackShare('x')}
            copied={copied}
            onPlay={startGame}
          />
        )}
      </main>
      {view !== 'play' && <MobileNav view={view} onNavigate={syncView} />}
      {showQuitConfirm && <LeaveConfirm onKeepPlaying={() => setShowQuitConfirm(false)} onLeave={goHome} />}
    </div>
  );
}

function Header({ view, name, source, soundOn, setSoundOn, onNavigate }: { view: View; name: string; source: ContentSource; soundOn: boolean; setSoundOn: (value: boolean) => void; onNavigate: (view: View) => void }) {
  return (
    <header className="relative z-40 border-b border-[#d7d0be] bg-[#f2efe6]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 md:px-6">
        <Link href="/" onClick={() => onNavigate('home')} className="group flex items-center gap-3 no-underline" data-testid="link-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#183d41] text-[#f6b94a] shadow-[3px_3px_0_#ec6c5b] transition-transform group-hover:-rotate-6">
            <MessageCircle size={21} strokeWidth={2.7} />
          </div>
          <div className="leading-none">
            <div className="font-mono-custom text-[10px] font-medium uppercase tracking-[.18em] text-[#ec6c5b]">{source === 'curated' ? 'CURATED X POSTS' : 'DEMO FALLBACK'}</div>
            <div className="mt-1 text-[17px] font-bold tracking-[-.04em] text-[#183d41]">Who Said It<span className="text-[#ec6c5b]">?</span> <span className="font-mono-custom text-[11px] font-medium tracking-normal text-[#567276]">KE</span></div>
          </div>
        </Link>
        <nav className="desktop-only flex items-center gap-7" aria-label="Primary navigation">
          <NavLink href="/" active={view === 'home'} icon={<HomeIcon size={15} />} label="Home" onClick={() => onNavigate('home')} testId="link-home" />
          <NavLink href="/play" active={view === 'play'} icon={<Zap size={15} />} label="Play" onClick={() => onNavigate('play')} testId="link-play" />
          <NavLink href="/leaders" active={view === 'leaders'} icon={<Trophy size={15} />} label="Leaders" onClick={() => onNavigate('leaders')} testId="link-leaders" />
          <NavLink href="/profile" active={view === 'profile'} icon={<UserRound size={15} />} label={name} onClick={() => onNavigate('profile')} testId="link-profile" />
        </nav>
        <button className="flex items-center gap-2 rounded-full border border-[#d7d0be] bg-[#f7f3e9] px-3 py-2 text-xs font-bold text-[#567276] transition-colors hover:border-[#183d41] hover:text-[#183d41]" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'} data-testid="button-sound-toggle">
          {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span className="desktop-only">{soundOn ? 'Sound on' : 'Sound off'}</span>
        </button>
      </div>
    </header>
  );
}

function NavLink({ href, active, icon, label, onClick, testId }: { href: string; active: boolean; icon: ReactNode; label: string; onClick: () => void; testId: string }) {
  return <Link href={href} onClick={onClick} className={`nav-link flex items-center gap-2 text-sm no-underline ${active ? 'active' : ''}`} data-testid={testId}>{icon}{label}</Link>;
}

function HomeScreen({ name, streak, bestScore, dailyCompleted, source, mode, onModeChange, startGame, onNavigate }: { name: string; streak: number; bestScore: number; dailyCompleted: boolean; source: ContentSource; mode: GameMode; onModeChange: (mode: GameModeId) => void; startGame: () => void; onNavigate: (view: View) => void }) {
  const live = source === 'curated';
  return (
    <div className="screen">
      <section className="relative overflow-hidden rounded-[28px] bg-[#183d41] px-6 py-9 text-[#f7f3e9] shadow-[5px_5px_0_#ec6c5b] md:px-12 md:py-14">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-[#f6b94a]/25" />
        <div className="absolute -bottom-28 right-32 h-52 w-52 rounded-full border-[18px] border-[#ec6c5b]/20" />
        <div className="relative grid items-end gap-10 md:grid-cols-[1fr_360px]">
          <div className="rise-in">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#ec6c5b] px-3 py-1 font-mono-custom text-[10px] font-medium uppercase tracking-[.16em] text-[#fff8e9]">TODAY'S DROP</span>
              <span className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#b9cfca]">{mode.questionCount} questions · {formatModeDuration(mode.totalSeconds)}</span>
              <span className={`flex items-center gap-1 rounded-full border px-3 py-1 font-mono-custom text-[10px] uppercase tracking-[.16em] ${live ? 'border-[#72d0a1]/40 text-[#a4f0c8]' : 'border-[#f6b94a]/40 text-[#f6d486]'}`}><Radio size={11} /> {live ? 'Curated X' : 'Demo fallback'}</span>
            </div>
            <h1 className="max-w-[680px] text-balance text-[clamp(2.8rem,7vw,5.8rem)] font-bold leading-[.92] tracking-[-.075em]">Think you know<br /><span className="text-[#f6b94a]">the voice?</span></h1>
            <p className="mt-6 max-w-[530px] text-[16px] leading-relaxed text-[#c9d6cf] md:text-[18px]">{live ? `${mode.questionCount} popular public posts from X. Four recognizable authors. ${mode.secondsPerQuestion} seconds per post.` : `${mode.questionCount} demo quotes. Four names. ${mode.secondsPerQuestion} seconds per question.`} {mode.id === 'quickfire' ? 'A perfect group-chat challenge with a little Nairobi pace.' : mode.description}</p>
             <div className="mt-7 grid max-w-[650px] gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Choose a game mode">
               {GAME_MODES.map((gameMode) => <button key={gameMode.id} onClick={() => onModeChange(gameMode.id)} role="radio" aria-checked={mode.id === gameMode.id} className={`rounded-2xl border p-4 text-left transition-all ${mode.id === gameMode.id ? 'border-[#f6b94a] bg-[#f6b94a]/15 shadow-[3px_3px_0_#ec6c5b]' : 'border-[#f7f3e9]/15 bg-[#f7f3e9]/[.06] hover:border-[#f6b94a]/60'}`} data-testid={`button-mode-${gameMode.id}`}><div className="flex items-center justify-between gap-2"><span className="font-bold">{gameMode.label}</span>{gameMode.signature && <span className="rounded-full bg-[#ec6c5b] px-2 py-1 font-mono-custom text-[8px] uppercase tracking-[.12em] text-[#fff8e9]">Signature</span>}</div><div className="mt-2 font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#a9c5be]">{gameMode.questionCount} Q · {formatModeDuration(gameMode.totalSeconds)}</div></button>)}
             </div>
             <button onClick={startGame} className="press mt-8 inline-flex items-center gap-3 rounded-xl bg-[#f6b94a] px-5 py-3.5 text-sm font-bold text-[#183d41] shadow-[3px_3px_0_#ec6c5b] transition-transform hover:-translate-y-0.5" data-testid="button-start-game">
               {dailyCompleted ? `Play ${mode.label}` : `Start ${mode.label}`} <ArrowRight size={18} />
            </button>
             <div className="mt-5 flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#91b4ac]"><Shield size={13} /> {live ? 'Public X posts from your curated dataset' : 'Demo content'}</div>
          </div>
          <div className="relative rise-in delay-2">
            <div className="rounded-2xl border border-[#f7f3e9]/15 bg-[#f7f3e9]/[.08] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[#a9c5be]"><span className="font-mono-custom text-[10px] uppercase tracking-[.18em]">Your rhythm</span><Target size={18} className="text-[#f6b94a]" /></div>
              <div className="mt-5 flex items-end gap-3"><span className="text-6xl font-bold tracking-[-.08em] text-[#f7f3e9]">{streak}</span><span className="mb-2 text-sm text-[#a9c5be]">day streak</span></div>
              <div className="mt-5 h-px bg-[#f7f3e9]/15" />
              <div className="mt-4 flex justify-between text-xs"><span className="text-[#a9c5be]">Best score</span><strong className="font-mono-custom text-[#f6b94a]">{bestScore ? bestScore.toLocaleString() : '—'}</strong></div>
              <div className="mt-4 flex -space-x-2"><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#183d41] bg-[#ec6c5b] text-[9px] font-bold">MK</span><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#183d41] bg-[#56a99e] text-[9px] font-bold text-[#183d41]">BO</span><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#183d41] bg-[#f6b94a] text-[9px] font-bold text-[#183d41]">WN</span><span className="ml-3 flex items-center text-[11px] text-[#a9c5be]">+ 214 playing today</span></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-10 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
        <div className="bg-grid rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-6 md:p-8">
          <div className="flex items-center justify-between"><div><div className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#ec6c5b]">HOW IT WORKS</div><h2 className="mt-2 text-2xl font-bold tracking-[-.05em]">Fast fingers, sharp ears.</h2></div><Sparkles className="text-[#e5a632]" size={25} /></div>
          <div className="mt-7 grid gap-6 sm:grid-cols-3">
             <Step number="01" title={live ? 'Read the post' : 'Read the quote'} copy={live ? 'Every line is shown as returned by X.' : 'Demo content is clearly labeled while X reconnects.'} />
             <Step number="02" title="Pick the voice" copy={live ? 'Four recognizable X authors. One best guess.' : 'Four demo names. One best guess.'} />
            <Step number="03" title="Beat the clock" copy="Speed and combos push your score higher." />
          </div>
        </div>
        <button onClick={() => onNavigate('leaders')} className="lift flex flex-col justify-between rounded-2xl bg-[#e7ddd0] p-6 text-left" data-testid="button-view-leaders">
          <div className="flex items-start justify-between"><div><div className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#567276]">THE CROWD</div><h2 className="mt-2 text-2xl font-bold tracking-[-.05em]">Today&apos;s<br />quickest minds.</h2></div><Crown size={27} className="text-[#ec6c5b]" /></div>
          <div className="mt-8 flex items-center justify-between text-sm font-bold text-[#183d41]">View the leaderboard <ChevronRight size={18} /></div>
        </button>
      </section>
      <section className="mt-10 flex flex-col justify-between gap-5 border-t border-[#d7d0be] pt-6 sm:flex-row sm:items-center">
         <div><p className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#ec6c5b]">A NOTE FROM THE HOUSE</p><p className="mt-2 text-sm text-[#567276]">{live ? 'These are exact public posts from the curated dataset. We never rewrite the post text.' : 'The curated post dataset is unavailable, so the game is using clearly labeled demo content.'}</p></div>
        <button onClick={() => onNavigate('profile')} className="flex items-center gap-2 text-sm font-bold text-[#183d41] underline decoration-[#f6b94a] decoration-2 underline-offset-4" data-testid="button-open-profile">Set your player profile <ArrowRight size={15} /></button>
      </section>
    </div>
  );
}

function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div><div className="font-mono-custom text-[11px] font-medium text-[#ec6c5b]">{number}</div><h3 className="mt-2 text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-[#567276]">{copy}</p></div>;
}

function GameScreen({ phase, countdown, question, questionIndex, timeLeft, selected, feedback, score, combo, hintUsed, hintForQuestion, source, mode, onAnswer, onHint, onQuit, lastPoints }: { phase: Phase; countdown: number; question: Question; questionIndex: number; timeLeft: number; selected: number | null; feedback: ResultKind | null; score: number; combo: number; hintUsed: boolean; hintForQuestion: number | null; source: ContentSource; mode: GameMode; onAnswer: (index: number | null) => void; onHint: () => void; onQuit: () => void; lastPoints: number }) {
  const live = source === 'curated';
  if (phase === 'countdown') {
    const isBoss = questionIndex === mode.questionCount - 1;
    return <div className="flex min-h-[calc(100dvh-81px)] items-center justify-center bg-[#183d41] px-5 text-center text-[#f7f3e9]"><div className="pop-in"><div className="font-mono-custom text-[11px] uppercase tracking-[.2em] text-[#f6b94a]">{isBoss ? 'THE FINAL BOSS' : questionIndex === 0 ? mode.label.toUpperCase() : `ROUND ${questionIndex + 1} OF ${mode.questionCount}`}</div><div className="mt-5 text-[clamp(7rem,26vw,14rem)] font-bold leading-none tracking-[-.1em] text-[#f7f3e9]">{countdown || 'GO'}</div><p className="mx-auto mt-4 max-w-[330px] text-sm text-[#a9c5be]">{isBoss ? 'One last voice. Make it count.' : live ? 'The post is public. The pressure is real.' : 'The quote is fictional. The pressure is real.'}</p><button onClick={onQuit} className="mt-10 text-xs font-bold uppercase tracking-widest text-[#a9c5be] underline underline-offset-4" data-testid="button-quit-countdown">Leave game</button></div></div>;
  }
  const eliminated = hintForQuestion === questionIndex && hintUsed ? question.options.filter((option) => option !== question.answer).slice(0, 2) : [];
  const timerPercent = Math.max(0, (timeLeft / mode.secondsPerQuestion) * 100);
  return (
    <div className={`min-h-[calc(100dvh-0px)] bg-[#183d41] px-4 pb-10 pt-5 text-[#f7f3e9] md:px-8 md:pt-8 ${feedback === 'wrong' || feedback === 'timeout' ? 'answer-shake' : ''}`}>
      <div className="mx-auto max-w-[850px]">
        <div className="flex items-center justify-between">
          <button onClick={onQuit} className="flex items-center gap-2 text-xs font-bold text-[#9ab8b0] transition-colors hover:text-[#f7f3e9]" data-testid="button-quit-game"><ArrowLeft size={16} /> Exit</button>
          <div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#9ab8b0]"><Radio size={12} className={live ? 'text-[#72d0a1]' : 'text-[#f6b94a]'} /> {live ? 'CURATED X' : 'DEMO FALLBACK'} <span className="text-[#567276]">/</span> {mode.label.toUpperCase()}</div>
          <div className="flex items-center gap-2 font-mono-custom text-xs text-[#f6b94a]"><Zap size={15} fill="currentColor" /> {score.toLocaleString()}</div>
        </div>
        <div className="mt-7 flex items-center gap-2" aria-label={`Question ${questionIndex + 1} of ${mode.questionCount}`}>
          {Array.from({ length: mode.questionCount }, (_, index) => <div key={index} className={`h-1.5 flex-1 rounded-full ${index < questionIndex ? 'bg-[#f6b94a]' : index === questionIndex ? 'bg-[#ec6c5b]' : 'bg-[#f7f3e9]/20'}`} />)}
        </div>
        <div className="mt-7 flex items-center justify-between"><div><span className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#f6b94a]">{question.tag}</span><p className="mt-1 text-xs text-[#9ab8b0]">Question {String(questionIndex + 1).padStart(2, '0')} <span className="text-[#567276]">of {String(mode.questionCount).padStart(2, '0')}</span></p></div><div className={`relative flex h-[70px] w-[70px] items-center justify-center rounded-full border-[5px] ${timeLeft <= 3 ? 'timer-pulse border-[#ec6c5b] text-[#ff9483]' : 'border-[#f6b94a] text-[#f6b94a]'}`}><span className="font-mono-custom text-xl font-medium">{Math.ceil(timeLeft)}</span><span className="absolute -bottom-5 font-mono-custom text-[8px] uppercase tracking-[.16em] text-[#9ab8b0]">seconds</span></div></div>
          <div className="mt-10 rounded-[25px] border border-[#f7f3e9]/15 bg-[#214c50] px-5 py-9 shadow-[5px_5px_0_rgba(0,0,0,.12)] md:px-12 md:py-12">
           <div className="flex items-center gap-2 text-[#ec6c5b]"><span className="h-2 w-2 rounded-full bg-[#ec6c5b]" /><span className="font-mono-custom text-[10px] font-medium uppercase tracking-[.18em]">{live ? 'A LIVE X POST' : 'A DEMO QUOTE'}</span></div>
          <blockquote className="mt-6 max-w-[700px] text-[clamp(1.8rem,4vw,3.35rem)] font-bold leading-[1.06] tracking-[-.065em] text-[#f7f3e9]">{question.quote}</blockquote>
           <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-[#9ab8b0]"><span>{question.context}</span><span className="text-[#567276]">•</span>{live && question.sourceUrl ? <a href={question.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#f6b94a] underline underline-offset-2">Open original post <ExternalLink size={12} /></a> : <span>No real person is being quoted.</span>}</div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {question.options.map((option, index) => {
            const isEliminated = eliminated.includes(option);
            const isCorrect = option === question.answer;
            const isChosen = selected === index;
            let stateClass = 'border-[#f7f3e9]/20 bg-[#214c50] hover:border-[#f6b94a] hover:bg-[#2b595d]';
            if (feedback && isCorrect) stateClass = 'border-[#72d0a1] bg-[#286455]';
            else if (feedback && isChosen && !isCorrect) stateClass = 'border-[#ec6c5b] bg-[#754a49]';
            if (isEliminated) stateClass = 'pointer-events-none border-[#f7f3e9]/10 bg-[#183d41]/45 opacity-35';
            return <button key={option} disabled={Boolean(feedback) || isEliminated} onClick={() => onAnswer(index)} className={`flex min-h-[66px] items-center gap-4 rounded-xl border px-4 text-left transition-all ${stateClass} ${!feedback && !isEliminated ? 'press' : ''}`} data-testid={`button-answer-${index + 1}`} aria-label={`Option ${index + 1}: ${option}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono-custom text-sm ${feedback && isCorrect ? 'bg-[#72d0a1] text-[#183d41]' : feedback && isChosen ? 'bg-[#ec6c5b] text-[#f7f3e9]' : 'bg-[#f7f3e9]/10 text-[#f6b94a]'}`}>{index + 1}</span><span className="text-sm font-bold md:text-base">{option}</span>{feedback && isCorrect && <Check size={18} className="ml-auto text-[#a4f0c8]" />}{feedback && isChosen && !isCorrect && <X size={18} className="ml-auto text-[#ffb3a5]" />}</button>;
          })}
        </div>
        <div className="mt-7 flex flex-col items-center justify-between gap-4 sm:flex-row"><button onClick={onHint} disabled={hintUsed || Boolean(feedback)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${hintUsed ? 'border-[#f7f3e9]/10 text-[#567276]' : 'border-[#f6b94a]/60 text-[#f6b94a] hover:bg-[#f6b94a]/10'}`} data-testid="button-use-hint"><Lightbulb size={15} /> {hintUsed ? 'Hint used' : 'Use one hint'} <span className="font-mono-custom text-[9px] opacity-70">[H]</span></button><div className="flex items-center gap-5 text-xs"><span className="text-[#9ab8b0]">Combo <strong className="ml-1 text-[#f6b94a]">x{combo}</strong></span><div className="w-28"><div className="h-1 rounded-full bg-[#f7f3e9]/15"><div className="h-1 rounded-full bg-[#ec6c5b] transition-all" style={{ width: `${timerPercent}%` }} /></div></div></div></div>
        <div className="mt-8 min-h-7 text-center" aria-live="polite">{feedback && <Feedback kind={feedback} points={lastPoints} answer={question.answer} combo={combo} />}</div>
      </div>
    </div>
  );
}

function Feedback({ kind, points, answer, combo }: { kind: ResultKind; points: number; answer: string; combo: number }) {
  if (kind === 'correct') return <div className="pop-in"><span className="font-bold text-[#a4f0c8]">That&apos;s it. +{points.toLocaleString()}</span>{combo > 1 && <span className="ml-2 font-mono-custom text-[10px] uppercase tracking-widest text-[#f6b94a]">Combo x{combo}</span>}</div>;
  if (kind === 'timeout') return <div className="pop-in text-sm font-bold text-[#ffb3a5]">Time. The answer was {answer}.</div>;
  return <div className="pop-in text-sm font-bold text-[#ffb3a5]">Not this time. The answer was {answer}.</div>;
}

function performanceMessage(correctCount: number, totalQuestions: number) {
  const ratio = totalQuestions ? correctCount / totalQuestions : 0;
  if (ratio === 1) return 'Politician master.';
  if (ratio >= 0.8) return 'Very sharp.';
  if (ratio >= 0.6) return 'Not bad.';
  if (correctCount === 2) return 'You can do better.';
  if (correctCount === 1) return 'We’ll keep that between us.';
  return 'The politicians won today.';
}

function rankForScore(score: number) {
  if (score >= 4300) return 9;
  if (score >= 3500) return 27;
  if (score >= 2500) return 84;
  if (score >= 1500) return 127;
  return 214;
}

function ResultsScreen({ name, score, correctCount, maxCombo, streak, records, mode, source, shareText, copied, onCopy, onShare, onWhatsapp, onX, onChallenge, onPlayAgain, onHome }: { name: string; score: number; correctCount: number; maxCombo: number; streak: number; records: AnswerRecord[]; mode: GameMode; source: ContentSource; shareText: string; copied: boolean; onCopy: () => void; onShare: () => void; onWhatsapp: () => void; onX: () => void; onChallenge: () => void; onPlayAgain: () => void; onHome: () => void }) {
  const rank = rankForScore(score);
  const totalTime = records.reduce((total, record) => total + record.time, 0);
  const ahead = Math.max(18, Math.min(96, 100 - Math.round(rank / 2.2)));
  return (
    <div className="screen">
      <div className="mx-auto max-w-[920px]">
        <section className="relative overflow-hidden rounded-[28px] bg-[#183d41] px-6 py-10 text-[#f7f3e9] shadow-[5px_5px_0_#f6b94a] md:px-12 md:py-14">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[22px] border-[#ec6c5b]/30" /><div className="absolute bottom-5 right-20 h-5 w-5 rounded-full bg-[#f6b94a]" /><div className="absolute bottom-16 right-40 h-3 w-3 rounded-full bg-[#ec6c5b]" />
           <div className="relative"><div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.2em] text-[#f6b94a]"><Radio size={12} /> CHALLENGE COMPLETE · {source === 'curated' ? 'CURATED X' : 'DEMO FALLBACK'} · {mode.label.toUpperCase()}</div><h1 className="mt-4 text-5xl font-bold tracking-[-.08em] md:text-7xl">Nice work,<br /><span className="text-[#f6b94a]">{name}.</span></h1><p className="mt-5 max-w-[420px] text-sm leading-relaxed text-[#b9cfca]">{performanceMessage(correctCount, mode.questionCount)} You read the room, trusted your instincts, and kept the pressure on.</p><div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-5"><div><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#9ab8b0]">YOUR SCORE</div><div className="score-roll mt-1 text-6xl font-bold tracking-[-.08em] text-[#f7f3e9]">{score.toLocaleString()}</div></div><div className="mb-1 flex gap-8"><div><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#9ab8b0]">CORRECT</div><div className="mt-1 text-2xl font-bold">{correctCount}<span className="text-[#9ab8b0]">/{mode.questionCount}</span></div></div><div><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#9ab8b0]">BEST COMBO</div><div className="mt-1 text-2xl font-bold text-[#f6b94a]">x{maxCombo}</div></div></div></div></div>
        </section>
        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-4"><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#567276]">YOUR RANK</div><div className="mt-1 text-3xl font-bold tracking-[-.06em]">#{rank}</div><div className="mt-1 text-xs text-[#567276]">Ahead of {ahead}% of players</div></div>
           <div className="rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-4"><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#567276]">TIME PLAYED</div><div className="mt-1 text-3xl font-bold tracking-[-.06em]">{totalTime.toFixed(1)}s</div><div className="mt-1 text-xs text-[#567276]">{mode.questionCount} {mode.label.toLowerCase()} questions</div></div>
          <div className="rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-4"><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#567276]">CURRENT STREAK</div><div className="mt-1 text-3xl font-bold tracking-[-.06em]">{streak} days</div><div className="mt-1 text-xs text-[#567276]">Come back tomorrow</div></div>
        </section>
        <div className="mt-5 rounded-xl border border-[#f6b94a]/40 bg-[#f6b94a]/15 px-4 py-3 text-sm font-bold text-[#183d41]">You&apos;re only {Math.max(80, score < 3500 ? 3500 - score : 120).toLocaleString()} points away from the next leaderboard jump.</div>
        <section className="mt-8 grid gap-5 md:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Your run</h2><Award className="text-[#ec6c5b]" size={22} /></div><div className="mt-5 space-y-3">{records.map((record, index) => <div key={`${record.time}-${index}`} className="flex items-center gap-3 border-b border-[#e2dccd] pb-3 last:border-0 last:pb-0"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${record.correct ? 'bg-[#c8e5d5] text-[#286455]' : 'bg-[#f2d0c8] text-[#a44b43]'}`}>{record.correct ? <Check size={14} /> : <X size={14} />}</span><span className="flex-1 text-xs font-bold">Question {index + 1}</span><span className="font-mono-custom text-[10px] text-[#567276]">{record.kind === 'timeout' ? 'OUT OF TIME' : `${record.time.toFixed(1)}s`}</span><strong className={`font-mono-custom text-xs ${record.points ? 'text-[#286455]' : 'text-[#a44b43]'}`}>{record.points ? `+${record.points}` : '—'}</strong></div>)}</div></div>
          <div className="rounded-2xl bg-[#e7ddd0] p-6"><div className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#ec6c5b]">SEND THE CHALLENGE</div><h2 className="mt-2 text-2xl font-bold tracking-[-.05em]">Keep the score<br />a little mysterious.</h2><p className="mt-3 text-sm leading-relaxed text-[#567276]">Share a spoiler-free card. Let your people find out the hard way.</p><div className="mt-5 rounded-xl border border-[#cfc3b0] bg-[#f7f3e9]/70 p-4 text-xs leading-relaxed text-[#567276]" data-testid="text-share-preview">{shareText}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={onShare} className="flex items-center gap-2 rounded-lg bg-[#183d41] px-3 py-2.5 text-xs font-bold text-[#f7f3e9] hover:bg-[#24555a]" data-testid="button-share-result"><Share2 size={14} /> Share</button><button onClick={onCopy} className="flex items-center gap-2 rounded-lg border border-[#bfb29e] px-3 py-2.5 text-xs font-bold hover:bg-[#f7f3e9]" data-testid="button-copy-result">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button><button onClick={onWhatsapp} className="rounded-lg border border-[#bfb29e] px-3 py-2.5 text-xs font-bold hover:bg-[#f7f3e9]" data-testid="button-share-whatsapp">WhatsApp</button><button onClick={onX} className="rounded-lg border border-[#bfb29e] px-3 py-2.5 text-xs font-bold hover:bg-[#f7f3e9]" data-testid="button-share-x">X</button></div></div>
        </section>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button onClick={onHome} className="flex items-center justify-center gap-2 rounded-xl border border-[#cfc3b0] px-5 py-3 text-sm font-bold hover:bg-[#f7f3e9]" data-testid="button-results-home"><ArrowLeft size={16} /> Back home</button><div className="flex flex-col gap-3 sm:flex-row"><button onClick={onChallenge} className="flex items-center justify-center gap-2 rounded-xl border border-[#cfc3b0] bg-[#f7f3e9] px-5 py-3 text-sm font-bold hover:bg-[#f7f3e9]" data-testid="button-challenge-friend"><MessageCircle size={16} /> Challenge a friend</button><button onClick={onPlayAgain} className="flex items-center justify-center gap-2 rounded-xl bg-[#ec6c5b] px-5 py-3 text-sm font-bold text-[#fff8e9] shadow-[3px_3px_0_#183d41] hover:-translate-y-0.5" data-testid="button-play-again"><RotateCcw size={16} /> Run it back</button></div></div>
      </div>
    </div>
  );
}

function LeadersScreen({ name, score, streak, onPlay }: { name: string; score: number; streak: number; onPlay: () => void }) {
  const [tab, setTab] = useState<'today' | 'week' | 'all'>('today');
  const multiplier = tab === 'today' ? 1 : tab === 'week' ? 1.12 : 1.35;
  const leaders = [...MOCK_LEADERS.map((leader) => ({ ...leader, score: Math.round(leader.score * multiplier) })), ...(score > 0 ? [{ name: `${name} (you)`, score, streak, initials: initials(name), color: 'gold' }] : [])].sort((a, b) => b.score - a.score);
  return <div className="screen"><div className="grid gap-8 md:grid-cols-[.78fr_1.22fr]"><section className="rise-in"><div className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-[#ec6c5b]">THE DAILY BOARD</div><h1 className="mt-3 text-5xl font-bold leading-[.94] tracking-[-.08em] md:text-7xl">Who&apos;s<br /><span className="text-[#ec6c5b]">quick today?</span></h1><p className="mt-6 max-w-[350px] text-sm leading-relaxed text-[#567276]">A friendly leaderboard for the people who hear a quote and just know.</p><button onClick={onPlay} className="mt-8 flex items-center gap-2 rounded-xl bg-[#183d41] px-5 py-3.5 text-sm font-bold text-[#f7f3e9] shadow-[3px_3px_0_#f6b94a] hover:-translate-y-0.5" data-testid="button-leaders-play">Play to climb <Zap size={16} className="text-[#f6b94a]" /></button><div className="mt-10 flex gap-8 border-t border-[#d7d0be] pt-5"><div><div className="font-mono-custom text-[10px] text-[#567276]">PLAYERS TODAY</div><strong className="mt-1 block text-2xl">214</strong></div><div><div className="font-mono-custom text-[10px] text-[#567276]">YOUR STREAK</div><strong className="mt-1 block text-2xl text-[#ec6c5b]">{streak} days</strong></div></div></section><section className="rise-in delay-2 rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-5 md:p-7"><div className="flex items-center justify-between border-b border-[#ded6c6] pb-5"><div><h2 className="text-xl font-bold">{tab === 'today' ? 'Today' : tab === 'week' ? 'This week' : 'All time'}&apos;s standouts</h2><p className="mt-1 text-xs text-[#567276]">Demo board · resets at midnight EAT</p></div><Trophy size={27} className="text-[#e5a632]" /></div><div className="mt-4 flex gap-1 rounded-xl bg-[#e7ddd0] p-1" role="tablist" aria-label="Leaderboard period">{(['today', 'week', 'all'] as const).map((period) => <button key={period} onClick={() => setTab(period)} className={`flex-1 rounded-lg px-2 py-2 font-mono-custom text-[10px] uppercase tracking-[.12em] ${tab === period ? 'bg-[#183d41] text-[#f7f3e9]' : 'text-[#567276]'}`} role="tab" aria-selected={tab === period}>{period === 'today' ? 'Today' : period === 'week' ? 'This week' : 'All time'}</button>)}</div><div className="mt-2">{leaders.map((leader, index) => <div key={`${leader.name}-${index}`} className={`flex items-center gap-3 border-b border-[#e5ddd0] py-4 last:border-0 ${leader.name.includes('(you)') ? 'rounded-xl bg-[#f6b94a]/15 px-3' : ''}`} data-testid={`row-leader-${index + 1}`}><div className={`w-7 text-center font-mono-custom text-xs ${index < 3 ? 'font-bold text-[#ec6c5b]' : 'text-[#567276]'}`}>{String(index + 1).padStart(2, '0')}</div><div className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold ${leader.color === 'coral' ? 'bg-[#ec6c5b] text-[#fff8e9]' : leader.color === 'teal' ? 'bg-[#94c9bc] text-[#183d41]' : leader.color === 'gold' ? 'bg-[#f6b94a] text-[#183d41]' : 'bg-[#183d41] text-[#f7f3e9]'}`}>{leader.initials}</div><div className="flex-1"><div className="text-sm font-bold">{leader.name}</div><div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#567276]"><Zap size={10} className="text-[#ec6c5b]" /> {leader.streak} day streak</div></div><div className="text-right"><div className="font-mono-custom text-sm font-medium">{leader.score.toLocaleString()}</div><div className="text-[9px] uppercase tracking-widest text-[#8a9792]">points</div></div>{index === 0 && <Crown size={16} className="text-[#e5a632]" />}</div>)}</div></section></div></div>;
}

function ProfileScreen({ name, initials: playerInitials, bestScore, streak, bestStreak, totalPoints, totalCorrect, totalAnswered, editing, setEditing, onSubmit, saveError, onPlay }: { name: string; initials: string; bestScore: number; streak: number; bestStreak: number; totalPoints: number; totalCorrect: number; totalAnswered: number; editing: boolean; setEditing: (value: boolean) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; saveError: string; onPlay: () => void }) {
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  return <div className="screen"><div className="mx-auto max-w-[930px]"><div className="flex flex-col gap-6 border-b border-[#d7d0be] pb-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-[#ec6c5b]">PLAYER PROFILE</div><h1 className="mt-3 text-5xl font-bold tracking-[-.08em]">Your corner<br /><span className="text-[#ec6c5b]">of the board.</span></h1></div><button onClick={onPlay} className="flex items-center justify-center gap-2 rounded-xl bg-[#183d41] px-5 py-3 text-sm font-bold text-[#f7f3e9] shadow-[3px_3px_0_#f6b94a]" data-testid="button-profile-play"><Zap size={16} className="text-[#f6b94a]" /> Play today</button></div><section className="mt-8 grid gap-5 md:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl bg-[#183d41] p-6 text-[#f7f3e9]"><div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#f6b94a] text-3xl font-bold text-[#183d41] shadow-[4px_4px_0_#ec6c5b]" data-testid="text-profile-initials">{playerInitials}</div>{editing ? <form onSubmit={onSubmit} className="mt-6"><label className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#9ab8b0]" htmlFor="playerName">Player name</label><input id="playerName" name="playerName" defaultValue={name} maxLength={18} className="mt-2 w-full rounded-lg border border-[#f7f3e9]/20 bg-[#214c50] px-3 py-3 text-sm text-[#f7f3e9]" autoFocus data-testid="input-player-name" />{saveError && <p className="mt-2 text-xs text-[#ffb3a5]" aria-live="polite" data-testid="status-profile-error">{saveError}</p>}<div className="mt-3 flex gap-2"><button type="submit" className="rounded-lg bg-[#f6b94a] px-3 py-2 text-xs font-bold text-[#183d41]" data-testid="button-save-profile">Save name</button><button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-[#f7f3e9]/20 px-3 py-2 text-xs font-bold text-[#c9d6cf]" data-testid="button-cancel-profile">Cancel</button></div></form> : <><h2 className="mt-5 text-2xl font-bold">{name}</h2><button onClick={() => setEditing(true)} className="mt-2 text-xs font-bold text-[#f6b94a] underline underline-offset-4" data-testid="button-edit-profile">Edit player name</button></>}<div className="mt-8 border-t border-[#f7f3e9]/15 pt-4 font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#9ab8b0]">Member since today</div></div><div className="grid gap-5 sm:grid-cols-2"><StatCard icon={<FlameIcon />} label="Current streak" value={`${streak} days`} detail={`Best: ${bestStreak} days`} /><StatCard icon={<Trophy size={21} />} label="Total points" value={totalPoints ? totalPoints.toLocaleString() : 'Not set'} detail={`Best round: ${bestScore ? bestScore.toLocaleString() : '—'}`} /><StatCard icon={<Target size={21} />} label="Accuracy" value={`${accuracy}%`} detail={`${totalCorrect} of ${totalAnswered} answers`} /><StatCard icon={<Medal size={21} />} label="Weekly rank" value={`#${rankForScore(bestScore)}`} detail="Demo leaderboard" /><div className="sm:col-span-2 rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-6"><div className="flex items-center justify-between"><div><div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-[#567276]">ACHIEVEMENTS</div><h3 className="mt-2 text-lg font-bold">Small wins count.</h3></div><Medal size={24} className="text-[#e5a632]" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Achievement icon={<Zap size={17} />} title="First drop" done={totalAnswered > 0} detail="Play your first game" /><Achievement icon={<Target size={17} />} title="Sharp ear" done={bestScore >= 1000} detail="Score 1,000 points" /><Achievement icon={<Crown size={17} />} title="Hot streak" done={streak >= 5} detail="Reach a 5 day streak" /></div></div></div></section></div></div>;
}

function FlameIcon() { return <Zap size={21} />; }
function StatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-[#d7d0be] bg-[#f7f3e9] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7ddd0] text-[#ec6c5b]">{icon}</div><div className="mt-5 font-mono-custom text-[10px] uppercase tracking-[.14em] text-[#567276]">{label}</div><div className="mt-1 text-2xl font-bold tracking-[-.05em]">{value}</div><div className="mt-1 text-xs text-[#8a9792]">{detail}</div></div>; }
function Achievement({ icon, title, done, detail }: { icon: ReactNode; title: string; done: boolean; detail: string }) { return <div className={`rounded-xl border p-3 ${done ? 'border-[#b9d8c8] bg-[#e5f1e9]' : 'border-[#dfd8ca] bg-[#f0ece3]'}`}><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${done ? 'bg-[#72c49f] text-[#183d41]' : 'bg-[#dfd8ca] text-[#8a9792]'}`}>{done ? <Check size={16} /> : <Lock size={15} />}</div><div className="mt-3 text-xs font-bold">{title}</div><div className="mt-1 text-[10px] leading-relaxed text-[#567276]">{detail}</div></div>; }

function LeaveConfirm({ onKeepPlaying, onLeave }: { onKeepPlaying: () => void; onLeave: () => void }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#183d41]/75 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="leave-title">
    <div className="w-full max-w-[390px] rounded-2xl border border-[#f7f3e9]/15 bg-[#214c50] p-6 text-[#f7f3e9] shadow-[6px_6px_0_#ec6c5b]">
      <div className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#f6b94a]">ACTIVE CHALLENGE</div>
      <h2 id="leave-title" className="mt-3 text-2xl font-bold tracking-[-.05em]">Leave challenge?</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#b9cfca]">Your current progress will be lost. You can always start a fresh run from the beginning.</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <button onClick={onKeepPlaying} className="rounded-xl bg-[#f6b94a] px-4 py-3 text-sm font-bold text-[#183d41]" autoFocus data-testid="button-keep-playing">Keep playing</button>
        <button onClick={onLeave} className="rounded-xl border border-[#f7f3e9]/20 px-4 py-3 text-sm font-bold text-[#f7f3e9]" data-testid="button-leave-game">Leave</button>
      </div>
    </div>
  </div>;
}

function ChallengeScreen({ name, mode, source, shareText, onShare, onCopy, onWhatsapp, onX, copied, onPlay }: { name: string; mode: GameMode; source: ContentSource; shareText: string; onShare: () => void; onCopy: () => void; onWhatsapp: () => void; onX: () => void; copied: boolean; onPlay: () => void }) {
  const live = source === 'curated';
  return <div className="screen"><div className="mx-auto max-w-[780px]"><div className="text-center"><div className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-[#ec6c5b]">CHALLENGE A FRIEND</div><h1 className="mt-4 text-5xl font-bold tracking-[-.08em] md:text-7xl">Your move,<br /><span className="text-[#ec6c5b]">people.</span></h1><p className="mx-auto mt-5 max-w-[390px] text-sm leading-relaxed text-[#567276]">{name} has a {live ? 'curated X post' : 'demo quote'} challenge for you. No spoilers. Just instincts.</p></div><div className="mx-auto mt-9 max-w-[560px] rotate-[-1deg] rounded-[24px] bg-[#183d41] p-7 text-[#f7f3e9] shadow-[6px_6px_0_#f6b94a] md:p-10"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><MessageCircle size={18} className="text-[#f6b94a]" /><span className="font-mono-custom text-[10px] uppercase tracking-[.18em]">WHO SAID IT? KE</span></div><span className="font-mono-custom text-[9px] text-[#ec6c5b]">{live ? 'CURATED X' : 'DEMO FALLBACK'}</span></div><div className="my-12 text-center"><div className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-[#9ab8b0]">A FRIEND LEFT YOU A CHALLENGE</div><div className="mt-5 text-3xl font-bold tracking-[-.06em] md:text-4xl">Can you clock<br />the voice?</div><div className="mt-5 text-sm text-[#b9cfca]">{mode.questionCount} {live ? 'public X posts' : 'demo quotes'} · {formatModeDuration(mode.totalSeconds)}</div></div><div className="flex items-center justify-between border-t border-[#f7f3e9]/15 pt-4"><span className="font-mono-custom text-[10px] text-[#9ab8b0]">#WHO SAID IT KE</span><span className="text-xs font-bold text-[#f6b94a]">Your turn next</span></div></div><div className="mt-9 flex flex-wrap justify-center gap-2"><button onClick={onShare} className="flex items-center gap-2 rounded-xl bg-[#ec6c5b] px-4 py-3 text-sm font-bold text-[#fff8e9] shadow-[3px_3px_0_#183d41]" data-testid="button-challenge-share"><Share2 size={16} /> Share challenge</button><button onClick={onCopy} className="flex items-center gap-2 rounded-xl border border-[#cfc3b0] bg-[#f7f3e9] px-4 py-3 text-sm font-bold" data-testid="button-challenge-copy">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy text'}</button><button onClick={onWhatsapp} className="rounded-xl border border-[#cfc3b0] bg-[#f7f3e9] px-4 py-3 text-sm font-bold" data-testid="button-challenge-whatsapp">WhatsApp</button><button onClick={onX} className="rounded-xl border border-[#cfc3b0] bg-[#f7f3e9] px-4 py-3 text-sm font-bold" data-testid="button-challenge-x">X</button></div><p className="mx-auto mt-5 max-w-[480px] text-center text-[11px] leading-relaxed text-[#8a9792]" data-testid="text-challenge-copy">{shareText}</p><div className="mt-10 text-center"><button onClick={onPlay} className="inline-flex items-center gap-2 text-sm font-bold text-[#183d41] underline decoration-[#f6b94a] decoration-2 underline-offset-4" data-testid="button-challenge-play">Play your own round <ArrowRight size={15} /></button></div></div></div>;
}

function MobileNav({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 hidden items-center justify-around border-t border-[#d7d0be] bg-[#f7f3e9]/95 px-3 py-3 backdrop-blur-lg" aria-label="Mobile navigation"><MobileNavItem icon={<HomeIcon size={18} />} label="Home" active={view === 'home'} onClick={() => onNavigate('home')} testId="mobile-link-home" /><MobileNavItem icon={<Zap size={18} />} label="Play" active={view === 'play'} onClick={() => onNavigate('play')} testId="mobile-link-play" /><MobileNavItem icon={<Trophy size={18} />} label="Leaders" active={view === 'leaders'} onClick={() => onNavigate('leaders')} testId="mobile-link-leaders" /><MobileNavItem icon={<UserRound size={18} />} label="Profile" active={view === 'profile'} onClick={() => onNavigate('profile')} testId="mobile-link-profile" /></nav>;
}
function MobileNavItem({ icon, label, active, onClick, testId }: { icon: ReactNode; label: string; active: boolean; onClick: () => void; testId: string }) { return <button onClick={onClick} className={`flex min-w-[60px] flex-col items-center gap-1 text-[10px] font-bold ${active ? 'text-[#ec6c5b]' : 'text-[#567276]'}`} data-testid={testId}>{icon}{label}</button>; }

export default App;