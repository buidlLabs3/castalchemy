import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getEducationLesson,
  getEducationLessons,
  getNextEducationStep,
  getPreviousEducationStep,
} from '../src/lib/education/lessons';

test('getEducationLessons returns the full tutorial set', () => {
  const lessons = getEducationLessons();

  assert.equal(lessons.length, 3);
  assert.deepEqual(
    lessons.map((lesson) => lesson.step),
    [1, 2, 3],
  );
  assert.ok(lessons.every((lesson) => lesson.totalSteps === 3));
});

test('getEducationLesson clamps invalid lesson requests safely', () => {
  assert.equal(getEducationLesson(null).step, 1);
  assert.equal(getEducationLesson('2').step, 2);
  assert.equal(getEducationLesson('999').step, 3);
  assert.equal(getEducationLesson('-5').step, 1);
});

test('education step helpers stay within range', () => {
  assert.equal(getPreviousEducationStep(1), 1);
  assert.equal(getPreviousEducationStep(3), 2);
  assert.equal(getNextEducationStep(1), 2);
  assert.equal(getNextEducationStep(3), 3);
});
