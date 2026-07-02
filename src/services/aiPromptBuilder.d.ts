export type AiPromptAction = 'generate' | 'explain' | 'debug' | 'optimize' | 'refactor' | 'documentation' | 'readme' | 'tests' | 'convert';

export interface AiPromptInput {
  action: AiPromptAction;
  code?: string;
  language?: string;
  instruction?: string;
  targetLanguage?: string;
  context?: string;
}

export const getActionLabel: (action: string) => string;
export const inferAction: (input: string) => AiPromptAction;
export const buildAiPrompt: (input: AiPromptInput) => string;
