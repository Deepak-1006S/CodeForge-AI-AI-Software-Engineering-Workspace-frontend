import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAiPrompt, getActionLabel } from './aiPromptBuilder.js';

test('buildAiPrompt includes the requested action and context', () => {
  const prompt = buildAiPrompt({
    action: 'generate',
    code: 'function add(a, b) { return a + b; }',
    language: 'typescript',
    instruction: 'Create a reusable helper',
  });

  assert.match(prompt, /Generate code/i);
  assert.match(prompt, /typescript/i);
  assert.match(prompt, /Create a reusable helper/i);
});

test('buildAiPrompt handles language conversion requests', () => {
  const prompt = buildAiPrompt({
    action: 'convert',
    code: 'const value = 1;',
    language: 'javascript',
    targetLanguage: 'python',
  });

  assert.match(prompt, /Convert/i);
  assert.match(prompt, /python/i);
});

test('getActionLabel returns readable UI labels', () => {
  assert.equal(getActionLabel('documentation'), 'Generate Documentation');
  assert.equal(getActionLabel('tests'), 'Generate Unit Tests');
});
