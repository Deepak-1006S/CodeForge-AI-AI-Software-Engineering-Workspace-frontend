import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Bug,
  Lightbulb,
  Zap,
  FileText,
  Code2,
  Wand2,
  BookText,
  TestTube2,
  Languages,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { runAiAction, type AiAction } from '../../services/aiEngine';

interface AIToolbarProps {
  code: string;
  language: string;
  onResponse?: (response: string, action: AiAction) => void;
}

export const AIToolbar: React.FC<AIToolbarProps> = ({ code, language, onResponse }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAIAction = async (action: AiAction) => {
    if (!code.trim()) {
      toast.error('Select or create a file with code first.');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(`AI is ${action}...`);

    try {
      const result = await runAiAction({
        action,
        code,
        language,
        instruction: `Perform ${action} for the current file.`,
      });

      onResponse?.(result.content, result.action);
      toast.success(`${result.label} complete`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('AI request failed. Please try again.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const tools = [
    {
      id: 'generate',
      label: 'Generate Code',
      icon: Wand2,
      color: 'text-purple-400 hover:bg-purple-500/10',
      action: () => handleAIAction('generate'),
    },
    {
      id: 'explain',
      label: 'Explain Code',
      icon: FileText,
      color: 'text-blue-400 hover:bg-blue-500/10',
      action: () => handleAIAction('explain'),
    },
    {
      id: 'debug',
      label: 'Debug Code',
      icon: Bug,
      color: 'text-red-400 hover:bg-red-500/10',
      action: () => handleAIAction('debug'),
    },
    {
      id: 'optimize',
      label: 'Optimize Code',
      icon: Zap,
      color: 'text-yellow-400 hover:bg-yellow-500/10',
      action: () => handleAIAction('optimize'),
    },
    {
      id: 'refactor',
      label: 'Refactor Code',
      icon: Code2,
      color: 'text-indigo-400 hover:bg-indigo-500/10',
      action: () => handleAIAction('refactor'),
    },
    {
      id: 'documentation',
      label: 'Generate Documentation',
      icon: BookText,
      color: 'text-emerald-400 hover:bg-emerald-500/10',
      action: () => handleAIAction('documentation'),
    },
    {
      id: 'readme',
      label: 'Generate README',
      icon: Lightbulb,
      color: 'text-cyan-400 hover:bg-cyan-500/10',
      action: () => handleAIAction('readme'),
    },
    {
      id: 'tests',
      label: 'Generate Unit Tests',
      icon: TestTube2,
      color: 'text-fuchsia-400 hover:bg-fuchsia-500/10',
      action: () => handleAIAction('tests'),
    },
    {
      id: 'convert',
      label: 'Convert Languages',
      icon: Languages,
      color: 'text-amber-400 hover:bg-amber-500/10',
      action: () => handleAIAction('convert'),
    },
  ];

  return (
    <div className="h-12 bg-gray-900/50 border-b border-gray-800 flex items-center px-4 gap-2">
      <div className="flex items-center gap-2 mr-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-gray-400">AI Tools:</span>
      </div>

      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={tool.action}
              disabled={isProcessing}
              className={`px-3 py-1.5 rounded-lg border border-gray-800 ${tool.color} transition-all text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
              title={tool.label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{tool.label}</span>
            </motion.button>
          );
        })}
      </div>

      {code && (
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span>{code.split('\n').length} lines</span>
          <span>•</span>
          <span>{code.length} characters</span>
          <span>•</span>
          <span className="capitalize">{language}</span>
        </div>
      )}
    </div>
  );
};
