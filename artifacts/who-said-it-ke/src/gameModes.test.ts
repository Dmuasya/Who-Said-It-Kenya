import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoundQuestions, buildShareText, GAME_MODES, getNextQuestionIndex } from './gameModes';

const expectedModes = [
  { id: 'quickfire', label: 'Quickfire', questionCount: 5, totalSeconds: 50, secondsPerQuestion: 10 },
  { id: 'classic', label: 'Classic', questionCount: 10, totalSeconds: 90, secondsPerQuestion: 9 },
  { id: 'marathon', label: 'Marathon', questionCount: 25, totalSeconds: 180, secondsPerQuestion: 7.2 },
] as const;

test('each game mode completes after its promised number of questions', () => {
  const sourceQuestions = Array.from({ length: 5 }, (_, index) => ({
    id: `question-${index}`,
    tag: `TAG-${index}`,
    options: ['A', 'B', 'C', 'D'],
  }));

  for (const expected of expectedModes) {
    const mode = GAME_MODES.find(({ id }) => id === expected.id);
    assert.deepEqual(mode && {
      id: mode.id,
      label: mode.label,
      questionCount: mode.questionCount,
      totalSeconds: mode.totalSeconds,
      secondsPerQuestion: mode.secondsPerQuestion,
    }, expected);

    const roundQuestions = buildRoundQuestions(sourceQuestions, mode, (items) => items);
    assert.equal(roundQuestions.length, expected.questionCount);
    assert.equal(roundQuestions.at(-1)?.tag, `FINAL BOSS · ${expected.label.toUpperCase()}`);

    const visitedQuestionIndexes: number[] = [];
    let questionIndex = 0;
    while (true) {
      visitedQuestionIndexes.push(questionIndex);
      const nextQuestionIndex = getNextQuestionIndex(questionIndex, expected.questionCount);
      if (nextQuestionIndex === null) break;
      questionIndex = nextQuestionIndex;
    }

    assert.equal(visitedQuestionIndexes.length, expected.questionCount);
    assert.deepEqual(visitedQuestionIndexes, Array.from({ length: expected.questionCount }, (_, index) => index));
  }
});

test('share copy includes the active mode and its complete question total', () => {
  for (const mode of GAME_MODES) {
    const answeredRecords = Array.from({ length: mode.questionCount }, (_, index) => ({ correct: index % 2 === 0 }));
    const shareText = buildShareText(1234, mode, answeredRecords);

    assert.match(shareText, new RegExp(`— ${mode.label} mode\\.`));
    assert.match(shareText, new RegExp(`\\d+/${mode.questionCount}\\n`));
    assert.equal((shareText.match(/[🟩🟥]/gu) || []).length, mode.questionCount);
  }
});