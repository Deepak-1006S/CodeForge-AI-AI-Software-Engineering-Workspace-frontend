import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import {
  ArrowRight,
  Check,
  Copy,
  Delete,
  Download,
  Edit3,
  Loader2,
  MessageCircle,
  Pin,
  Plus,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  createChat,
  deleteChat,
  getChat,
  getChats,
  streamChatResponse,
  updateChat,
} from '../../services/chat.service';
import type { ChatDetails, ChatMessage, ChatSummary } from '@/types';

marked.setOptions({
  gfm: true,
  breaks: true,
  smartypants: false,
  highlight: (code: string, language: string) => {
    const validLanguage = language && Prism.languages[language] ? language : 'javascript';
    const grammar = Prism.languages[validLanguage] || Prism.languages.javascript;
    return Prism.highlight(code, grammar, validLanguage);
  },
} as any);

const getMarkdownHtml = (text: string) => {
  const renderer: any = new marked.Renderer();

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  renderer.code = (code: string, infostring: string | undefined, escaped: boolean) => {
    const language = (infostring || '').trim().split(/\s+/g)[0] || 'text';
    const escapedCode = escaped ? code : escapeHtml(code || '');
    const langClass = language ? `language-${language}` : 'language-text';
    return `<pre class="rounded-2xl bg-slate-950 p-4 overflow-x-auto text-slate-100"><code class="${langClass}">${escapedCode}</code></pre>`;
  };

  renderer.paragraph = (text: string) => `<p class="mb-3 leading-7 text-slate-200">${text}</p>`;
  renderer.heading = (text: string, level: number) => `<h${level} class="mt-6 mb-3 font-semibold text-slate-100">${text}</h${level}>`;
  renderer.list = (body: string, ordered: boolean) => {
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag} class="mb-4 ml-5 list-disc text-slate-200">${body}</${tag}>`;
  };
  renderer.blockquote = (quote: string) => `<blockquote class="border-l-4 border-slate-600 pl-4 italic text-slate-300">${quote}</blockquote>`;

  return marked.parse(text, { renderer });
};

const formatChatTitle = (title: string) => title || 'Untitled conversation';

export const ChatWorkspace: React.FC = () => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatDetails | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [chatActionLoading, setChatActionLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch (error) {
      toast.error('Unable to load chats.');
    }
  }, []);

  const loadChat = useCallback(async (chatId: string) => {
    try {
      const data = await getChat(chatId);
      setSelectedChat(data);
      setTitleDraft(data.title);
    } catch (error) {
      toast.error('Unable to load conversation.');
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (!selectedChat && chats.length > 0) {
      void loadChat(chats[0]._id);
    }
  }, [chats, loadChat, selectedChat]);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages.length, isStreaming]);

  const refreshSelectedChat = async () => {
    if (!selectedChat) return;
    await loadChat(selectedChat._id);
    await loadChats();
  };

  const handleSelectChat = (chatId: string) => {
    if (isStreaming) {
      toast.error('Finish the current response before switching conversations.');
      return;
    }
    loadChat(chatId);
  };

  const handleCreateChat = async (): Promise<ChatDetails | null> => {
    if (chatActionLoading) return null;
    setChatActionLoading(true);
    try {
      const newChat = await createChat();
      await loadChats();
      setSelectedChat(newChat);
      setTitleDraft(newChat.title);
      toast.success('New conversation created');
      return newChat;
    } catch (error) {
      toast.error('Unable to create a new conversation.');
      return null;
    } finally {
      setChatActionLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!selectedChat) return;
    try {
      const updated = await updateChat(selectedChat._id, { title: titleDraft.trim() || 'New chat' });
      setSelectedChat(updated);
      setChats((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setEditingTitle(false);
      toast.success('Conversation renamed');
    } catch (error) {
      toast.error('Unable to rename conversation.');
    }
  };

  const handleTogglePin = async () => {
    if (!selectedChat) return;
    try {
      const updated = await updateChat(selectedChat._id, { pinned: !selectedChat.pinned });
      setSelectedChat(updated);
      setChats((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(updated.pinned ? 'Pinned conversation' : 'Unpinned conversation');
    } catch (error) {
      toast.error('Unable to update pin status.');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat || chatActionLoading) return;
    setChatActionLoading(true);
    try {
      await deleteChat(selectedChat._id);
      await loadChats();
      const nextChat = chats.find((chat) => chat._id !== selectedChat._id);
      if (nextChat) {
        await loadChat(nextChat._id);
      } else {
        setSelectedChat(null);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Unable to delete conversation.');
    } finally {
      setChatActionLoading(false);
    }
  };

  const handleExportChat = () => {
    if (!selectedChat) return;
    const lines = [`# ${selectedChat.title}`, `Generated: ${new Date(selectedChat.updatedAt).toLocaleString()}`, ''];
    selectedChat.messages.forEach((message) => {
      const role = message.role === 'assistant' ? 'Assistant' : 'You';
      lines.push(`## ${role}`);
      lines.push(message.content);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedChat.title.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'chat'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported');
  };

  const applyStreamDelta = (content: string) => {
    setSelectedChat((current) => {
      if (!current) return current;
      const messages = [...current.messages];
      const lastAssistantIndex = messages.map((message) => message.role).lastIndexOf('assistant');
      if (lastAssistantIndex === -1) {
        messages.push({ role: 'assistant', content, createdAt: new Date().toISOString() });
      } else {
        messages[lastAssistantIndex] = {
          ...messages[lastAssistantIndex],
          content,
        };
      }
      return { ...current, messages };
    });
  };

  const handleStreamResponse = async (path: string, payload: Record<string, unknown>) => {
    if (!selectedChat) return;
    setIsStreaming(true);
    setIsLoading(true);
    const previousMessages = selectedChat.messages;

    try {
      await streamChatResponse(path, payload, {
        onMessage: ({ content }) => {
          applyStreamDelta(content);
        },
        onDone: async () => {
          await refreshSelectedChat();
          setIsStreaming(false);
          setIsLoading(false);
        },
        onError: (message) => {
          toast.error(message);
          setIsStreaming(false);
          setIsLoading(false);
          setSelectedChat((current) => {
            if (!current) return current;
            return { ...current, messages: previousMessages };
          });
        },
      });
    } catch (error) {
      toast.error('Chat stream failed.');
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!draft.trim()) return;
    let currentChat = selectedChat;
    if (!currentChat) {
      currentChat = await handleCreateChat();
    }
    if (!currentChat) return;

    const trimmedMessage = draft.trim();
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    setSelectedChat((current) => {
      if (!current) return current;
      return {
        ...current,
        messages: [...current.messages, userMessage, { role: 'assistant', content: '', createdAt: new Date().toISOString() }],
      };
    });
    setDraft('');
    await handleStreamResponse(`/chats/${currentChat._id}/messages`, { message: trimmedMessage });
  };

  const handleContinueResponse = async () => {
    if (!selectedChat || isStreaming) return;
    setSelectedChat((current) => {
      if (!current) return current;
      return { ...current, messages: [...current.messages, { role: 'assistant', content: '', createdAt: new Date().toISOString() }] };
    });
    await handleStreamResponse(`/chats/${selectedChat._id}/continue`, {});
  };

  const handleRegenerateResponse = async () => {
    if (!selectedChat || isStreaming) return;
    setSelectedChat((current) => {
      if (!current) return current;
      return { ...current, messages: [...current.messages, { role: 'assistant', content: '', createdAt: new Date().toISOString() }] };
    });
    await handleStreamResponse(`/chats/${selectedChat._id}/regenerate`, {});
  };

  const handleCopyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyingId(id);
      setTimeout(() => setCopyingId(null), 2000);
      toast.success('Copied message content');
    } catch {
      toast.error('Copy failed');
    }
  };

  const selectedChatTitle = selectedChat ? selectedChat.title : 'No conversation selected';

  const chatSummary = useMemo(() => {
    if (!selectedChat) return 'Create a new conversation or choose a pinned chat to get started.';
    return `${selectedChat.messages.length} message${selectedChat.messages.length === 1 ? '' : 's'} • Last updated ${new Date(selectedChat.updatedAt).toLocaleString()}`;
  }, [selectedChat]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.35fr_0.65fr]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-500">AI Conversations</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Saved chats</h2>
          </div>
          <button
            type="button"
            onClick={handleCreateChat}
            disabled={chatActionLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        <div className="space-y-3">
          {chats.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No saved conversations yet. Create a new chat to start storing AI conversations in MongoDB.
            </div>
          ) : (
            chats.map((chat) => (
              <button
                type="button"
                key={chat._id}
                onClick={() => handleSelectChat(chat._id)}
                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedChat?._id === chat._id ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{chat.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{chat.lastMessage || 'New conversation'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    {chat.pinned && <Pin className="h-4 w-4 text-amber-500" />}
                    <span className="text-[11px] uppercase tracking-[0.24em]">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm text-sky-300">
              <MessageCircle className="h-4 w-4" />
              <span>Conversation workspace</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">{selectedChatTitle}</h3>
            <p className="mt-2 text-sm text-slate-300">{chatSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTogglePin}
              disabled={!selectedChat}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pin className="h-4 w-4" />
              {selectedChat?.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              disabled={!selectedChat}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Edit3 className="h-4 w-4" />
              Rename
            </button>
            <button
              type="button"
              onClick={handleExportChat}
              disabled={!selectedChat}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              type="button"
              onClick={handleDeleteChat}
              disabled={!selectedChat || chatActionLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-600 bg-red-600/10 px-4 py-2 text-sm text-red-700 hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {selectedChat ? (
          <div className="space-y-6">
            <div className="space-y-4">
              {selectedChat.messages.map((message, idx) => (
                <div key={`${message.role}-${idx}`} className={`rounded-3xl p-5 ${message.role === 'user' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{message.role === 'user' ? 'You' : 'Assistant'}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {message.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(message.content, `${selectedChat._id}-${idx}`)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        {copyingId === `${selectedChat._id}-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    )}
                  </div>
                  <div className={message.role === 'assistant' ? 'prose prose-sm max-w-none text-slate-200' : 'whitespace-pre-wrap text-sm leading-7 text-slate-900'}>
                    {message.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: getMarkdownHtml(message.content || (isStreaming && idx === selectedChat.messages.length - 1 ? '...' : '')) }} />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-7">{message.content}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={contentRef} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <textarea
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask the AI anything or ask it to continue the conversation..."
                  className="min-h-[140px] w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  disabled={isStreaming}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!draft.trim() || isStreaming}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isStreaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Send
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={handleContinueResponse}
                  disabled={isStreaming}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw className="mr-2 inline-block h-4 w-4" />
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateResponse}
                  disabled={isStreaming}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="mr-2 inline-block h-4 w-4" />
                  Regenerate
                </button>
                <span className="inline-flex items-center gap-2 text-slate-500">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  Streaming AI responses in real time
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">Start a new AI conversation</p>
            <p className="mt-2 text-sm">Create a chat or select one from the sidebar to keep your history and continue conversations.</p>
          </div>
        )}
      </div>

      {editingTitle && selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Rename conversation</h3>
            <p className="mt-2 text-sm text-slate-500">Give this chat a descriptive name so you can find it later.</p>
            <input
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Conversation title"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTitle(false)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateTitle}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
