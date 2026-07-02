const ACTIONS = {
  generate: {
    label: 'Generate Code',
    instruction: 'Generate code',
  },
  explain: {
    label: 'Explain Code',
    instruction: 'Explain the provided code clearly',
  },
  debug: {
    label: 'Debug Code',
    instruction: 'Debug the provided code and explain the issue',
  },
  optimize: {
    label: 'Optimize Code',
    instruction: 'Optimize the provided code for readability and performance',
  },
  refactor: {
    label: 'Refactor Code',
    instruction: 'Refactor the provided code while preserving behavior',
  },
  documentation: {
    label: 'Generate Documentation',
    instruction: 'Generate concise documentation for the provided code',
  },
  readme: {
    label: 'Generate README',
    instruction: 'Generate a polished README for the project or component',
  },
  tests: {
    label: 'Generate Unit Tests',
    instruction: 'Generate unit tests for the provided code',
  },
  convert: {
    label: 'Convert Programming Languages',
    instruction: 'Convert the provided code to the target language',
  },
};

export const getActionLabel = (action) => ACTIONS[action]?.label ?? 'AI Assistant';

export const inferAction = (input) => {
  const value = input.toLowerCase();

  if (/(debug|bug|issue|error|fix)/.test(value)) return 'debug';
  if (/(optimi|performance|speed)/.test(value)) return 'optimize';
  if (/(refactor|clean up|rewrite)/.test(value)) return 'refactor';
  if (/(document|docs|comment)/.test(value)) return 'documentation';
  if (/(readme|overview)/.test(value)) return 'readme';
  if (/(test|unit test|spec)/.test(value)) return 'tests';
  if (/(convert|translate|port to|to python|to javascript|to typescript|to java)/.test(value)) return 'convert';
  if (/(explain|what does|how does|mean)/.test(value)) return 'explain';
  return 'generate';
};

export const buildAiPrompt = ({ action, code, language, instruction, targetLanguage, context }) => {
  const metadata = ACTIONS[action] ?? ACTIONS.generate;
  const languageLabel = language || 'unknown';
  const targetLanguageLabel = targetLanguage || 'the requested target language';
  const codeSnippet = code?.trim() ? `\n\nCurrent code:\n\n\`
${code}\n\`
` : '';
  const contextSnippet = context?.trim() ? `\n\nAdditional context:\n${context}` : '';
  const userInstruction = instruction?.trim() ? `\n\nUser request:\n${instruction}` : '';

  if (action === 'convert') {
    return `You are a senior software engineer. ${metadata.instruction} for the supplied ${languageLabel} code.\nReturn only the converted code unless the user explicitly asks for explanation.\nUse modern syntax and preserve the intent of the original implementation.\nTarget language: ${targetLanguageLabel}.${codeSnippet}${contextSnippet}${userInstruction}`;
  }

  return `You are a senior software engineer. ${metadata.instruction} for the supplied ${languageLabel} code.\nProvide a direct answer with concise reasoning and include code when it helps.\nIf the request is for code generation, return a complete implementation snippet in a fenced code block.\nIf the request is for documentation or explanation, use Markdown and keep it practical.${codeSnippet}${contextSnippet}${userInstruction}`;
};
