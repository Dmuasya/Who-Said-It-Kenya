export type GameModeId = 'quickfire' | 'classic' | 'marathon';

export type GameMode = {
  id: GameModeId;
  label: string;
  questionCount: number;
  totalSeconds: number;
  secondsPerQuestion: number;
  description: string;
  signature?: boolean;
};

export const GAME_MODES: GameMode[] = [
  { id: 'quickfire', label: 'Quickfire', questionCount: 5, totalSeconds: 50, secondsPerQuestion: 10, description: 'The signature five-question group challenge.', signature: true },
  { id: 'classic', label: 'Classic', questionCount: 10, totalSeconds: 90, secondsPerQuestion: 9, description: 'A longer round for sharper pattern-spotting.' },
  { id: 'marathon', label: 'Marathon', questionCount: 25, totalSeconds: 180, secondsPerQuestion: 7.2, description: 'Twenty-five posts. Three minutes. Stay locked in.' },
];

export function getGameMode(id: GameModeId) {
  return GAME_MODES.find((mode) => mode.id === id) || GAME_MODES[0];
}

export function formatModeDuration(totalSeconds: number) {
  return totalSeconds >= 60 ? `${Math.floor(totalSeconds / 60)} min${totalSeconds % 60 ? ` ${totalSeconds % 60} sec` : ''}` : `${totalSeconds} seconds`;
}

export function getNextQuestionIndex(currentIndex: number, questionCount: number) {
  return currentIndex >= questionCount - 1 ? null : currentIndex + 1;
}

export type RoundQuestion = {
  id: string;
  tag: string;
  options: string[];
};

export function buildRoundQuestions<T extends RoundQuestion>(sourceQuestions: T[], mode: GameMode, shuffleOptions: <Option>(items: Option[]) => Option[]) {
  return Array.from({ length: mode.questionCount }, (_, index) => {
    const question = sourceQuestions[index % sourceQuestions.length];
    return {
      ...question,
      id: `${question.id}-${mode.id}-${index}`,
      tag: index === mode.questionCount - 1 ? `FINAL BOSS · ${mode.label.toUpperCase()}` : question.tag,
      options: shuffleOptions(question.options),
    };
  });
}

export type ShareAnswerRecord = {
  correct: boolean;
};

export function buildShareText(score: number, mode: GameMode, answerRecords: ShareAnswerRecord[]) {
  const correctCount = answerRecords.filter((record) => record.correct).length;
  const shareGrid = answerRecords.map((record) => (record.correct ? '🟩' : '🟥')).join('');
  return `I scored ${score.toLocaleString()} points on Who Said It? Kenya — ${mode.label} mode.\n${shareGrid || '⬜'.repeat(mode.questionCount)} ${correctCount}/${mode.questionCount}\nCan you beat my score? #WhoSaidItKE`;
}