import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AiAction } from '../../services/aiEngine';
import { motion } from 'framer-motion';
import {
  Code2,
  MessageSquare,
  Play,
  Save,
  FolderTree,
  HardDriveDownload,
  Upload,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { MonacoEditor } from '../../components/workspace/MonacoEditor';
import { AIChatPanel } from '../../components/workspace/AIChatPanel';
import { FileExplorer } from '../../components/workspace/FileExplorer';
import { AIToolbar } from '../../components/workspace/AIToolbar';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { FileNode } from '../../types/workspace.types';

const workspaceFeatures = ['Monaco editor', 'File explorer', 'Folder explorer', 'Multiple tabs', 'Upload', 'Download', 'Search files', 'Auto save'];

const getFileLanguageFromName = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

const findNodeById = (nodes: FileNode[], id: string): FileNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const CodeWorkspacePage: React.FC = () => {
  const {
    root,
    currentFileId,
    activeFileContent,
    activeFileLanguage,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    setActiveFile,
    updateCurrentFileContent,
    updateCurrentFileLanguage,
    createNode,
    renameNode,
    deleteNode,
    persistWorkspace,
  } = useWorkspace();

  const [showChat, setShowChat] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [aiAction, setAiAction] = useState<AiAction>('generate');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFile = useMemo(() => {
    if (!currentFileId) return null;
    return findNodeById(root, currentFileId);
  }, [root, currentFileId]);

  const handleFileSelect = (fileId: string) => {
    setActiveFile(fileId);
    setOpenTabs((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
  };

  const handleCloseTab = (fileId: string) => {
    setOpenTabs((prev) => prev.filter((id) => id !== fileId));
    if (fileId === currentFileId) {
      const nextTab = openTabs.find((id) => id !== fileId) ?? null;
      setActiveFile(nextTab);
    }
  };

  useEffect(() => {
    if (!currentFileId) return;
    setOpenTabs((prev) => (prev.includes(currentFileId) ? prev : [...prev, currentFileId]));
  }, [currentFileId]);

  const handleNewFile = (parentId: string | null) => {
    const fileName = window.prompt('New file name', 'untitled.js');
    if (!fileName?.trim()) return;
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    createNode(parentId, {
      id,
      name: fileName.trim(),
      type: 'file',
      language: getFileLanguageFromName(fileName.trim()),
      content: '',
    });
    handleFileSelect(id);
  };

  const handleNewFolder = (parentId: string | null) => {
    const folderName = window.prompt('New folder name', 'New Folder');
    if (!folderName?.trim()) return;
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    createNode(parentId, {
      id,
      name: folderName.trim(),
      type: 'folder',
      children: [],
    });
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
    if (!newName.trim()) return;
    renameNode(nodeId, newName.trim());
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteNode(nodeId);
  };

  const handleFileDownload = () => {
    if (!currentFile || currentFile.type !== 'file') return;
    const blob = new Blob([currentFile.content ?? ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = currentFile.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const contents = await file.text();
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    createNode(null, {
      id,
      name: file.name,
      type: 'file',
      language: getFileLanguageFromName(file.name),
      content: contents,
    });
    handleFileSelect(id);
    event.target.value = '';
  };

  const handleManualSave = () => {
    persistWorkspace(root);
  };

  const activeLanguage = currentFile?.type === 'file' ? currentFile.language ?? 'plaintext' : 'plaintext';
  const activeContent = currentFile?.type === 'file' ? currentFile.content ?? '' : '// Select a file to begin editing';

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-950">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">CodeForge AI Workspace</h1>
              <p className="text-sm text-slate-400">VS Code-inspired editing with AI assistance and auto-save.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleManualSave} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
              <Save className="h-4 w-4" />
              Save
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => console.log('Run code', activeContent)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
              <Play className="h-4 w-4" />
              Run
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowExplorer(!showExplorer)} className={`rounded-lg p-2 transition-colors ${showExplorer ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              <FolderTree className="h-4 w-4" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowChat(!showChat)} className={`rounded-lg p-2 transition-colors ${showChat ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              <MessageSquare className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {workspaceFeatures.map((feature) => (
            <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <AIToolbar code={activeContent} language={activeLanguage} onResponse={(response, action) => {
        setAiResponse(response);
        setAiAction(action);
      }} />

      <div className="flex flex-1 overflow-hidden">
        {showExplorer && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="w-72 overflow-y-auto border-r border-gray-800 bg-gray-900">
            <FileExplorer
              files={root}
              currentFile={currentFileId}
              onFileSelect={handleFileSelect}
              onCreateFile={handleNewFile}
              onCreateFolder={handleNewFolder}
              onRename={handleRenameNode}
              onDelete={handleDeleteNode}
            />
          </motion.div>
        )}

        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2 text-sm text-slate-400">
            <div className="flex flex-1 items-center gap-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspace files..."
                className="w-full rounded-lg border border-gray-700 bg-gray-950/70 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleFileUploadClick} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 hover:border-indigo-500 hover:text-white transition-colors">
                <Upload className="h-4 w-4" />
              </button>
              <button onClick={handleFileDownload} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 hover:border-indigo-500 hover:text-white transition-colors">
                <HardDriveDownload className="h-4 w-4" />
              </button>
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
          </div>

          {searchQuery && searchResults.length > 0 && (
            <div className="border-b border-gray-800 bg-gray-900 px-4 py-3 text-sm text-slate-300">
              <div className="font-semibold text-slate-200">Search results</div>
              <div className="mt-2 grid gap-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-left text-sm text-gray-200 hover:border-indigo-500"
                    onClick={() => handleFileSelect(result.id)}
                  >
                    <div className="font-medium text-white">{result.name}</div>
                    <div className="text-xs text-slate-500">{result.path}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900/80 px-4 py-2 text-sm text-slate-300 overflow-x-auto">
            {openTabs.map((fileId) => {
              const file = findNodeById(root, fileId);
              if (!file || file.type !== 'file') return null;
              const isActive = fileId === currentFileId;
              return (
                <div key={fileId} className={`flex items-center gap-2 rounded-lg px-3 py-1 ${isActive ? 'bg-indigo-600/20 text-white' : 'bg-gray-950 text-slate-300'}`}>
                  <button type="button" onClick={() => handleFileSelect(fileId)}>{file.name}</button>
                  <button type="button" onClick={() => handleCloseTab(fileId)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <MonacoEditor
            value={activeContent}
            language={activeLanguage}
            onChange={(value) => updateCurrentFileContent(value ?? '')}
          />
        </div>

        {showChat && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex w-96 flex-col border-l border-gray-800 bg-gray-900">
            <AIChatPanel code={activeContent} language={activeLanguage} onCodeUpdate={(value) => updateCurrentFileContent(value)} initialResponse={aiResponse} initialAction={aiAction} />
          </motion.div>
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
    </div>
  );
};
