import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAiPrompt, inferAction, getActionLabel } from './aiPromptBuilder';

export type AiAction = 'generate' | 'explain' | 'debug' | 'optimize' | 'refactor' | 'documentation' | 'readme' | 'tests' | 'convert';

export interface AiRequest {
  action?: AiAction;
  code?: string;
  language?: string;
  instruction?: string;
  targetLanguage?: string;
  context?: string;
}

export interface AiEngineResult {
  content: string;
  action: AiAction;
  label: string;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const createModel = () => {
  if (!apiKey) {
    return null;
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

let cachedModel: ReturnType<typeof createModel> | null = null;

const getModel = () => {
  if (!cachedModel) {
    cachedModel = createModel();
  }

  return cachedModel;
};

const fallbackResponse = (request: AiRequest): AiEngineResult => {
  const inferredAction = request.action ?? inferAction(request.instruction || request.code || '');
  const label = getActionLabel(inferredAction);
  const prompt = buildAiPrompt({
    action: inferredAction,
    code: request.code,
    language: request.language,
    instruction: request.instruction,
    targetLanguage: request.targetLanguage,
    context: request.context,
  });

  return {
    content: `AI provider is not configured yet.\n\n${label}\n\nPrompt preview:\n\n${prompt}`,
    action: inferredAction,
    label,
  };
};

export const runAiAction = async (request: AiRequest): Promise<AiEngineResult> => {
  const inferredAction = request.action ?? inferAction(request.instruction || request.code || '');
  const label = getActionLabel(inferredAction);
  const prompt = buildAiPrompt({
    action: inferredAction,
    code: request.code,
    language: request.language,
    instruction: request.instruction,
    targetLanguage: request.targetLanguage,
    context: request.context,
  });

  const model = getModel();
  if (!model) {
    return fallbackResponse(request);
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return {
      content: responseText || `No response received from the configured AI provider.`,
      action: inferredAction,
      label,
    };
  } catch (error) {
    console.error('AI provider call failed', error);
    return {
      content: `The configured AI provider returned an error.\n\n${error instanceof Error ? error.message : 'Unknown error'}`,
      action: inferredAction,
      label,
    };
  }
};
