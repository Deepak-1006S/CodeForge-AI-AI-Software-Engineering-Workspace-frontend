import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { runAiAction, type AiAction } from '../../services/aiEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  code: string;
  language: string;
  onCodeUpdate: (code: string) => void;
  initialResponse?: string;
  initialAction?: AiAction;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ code, language, onCodeUpdate, initialResponse, initialAction }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI coding assistant. I can help you:\n\n• Generate code\n• Debug code\n• Explain code\n• Optimize performance\n• Refactor and document code\n• Generate tests and README files\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!initialResponse) return;

    const assistantMessage: Message = {
      id: `${Date.now()}-response`,
      role: 'assistant',
      content: initialResponse,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  }, [initialResponse]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const action = initialAction ?? 'generate';
      const result = await runAiAction({
        action,
        code,
        language,
        instruction: input,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `The AI request failed. ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickActions = [
    { label: 'Explain code', icon: '📖' },
    { label: 'Fix bugs', icon: '🐛' },
    { label: 'Optimize', icon: '⚡' },
    { label: 'Add comments', icon: '💬' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 bg-gray-850 border-b border-gray-800">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInput(action.label)}
              className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 text-sm text-gray-300 flex items-center gap-2 transition-colors"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopy(message.content, message.id)}
                      className="p-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500" />
                      )}
                    </motion.button>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3 border border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-sm text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything about your code..."
            rows={3}
            className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};
