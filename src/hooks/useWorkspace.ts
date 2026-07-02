import { useCallback, useEffect, useState } from 'react';
import type { FileNode } from '../types/workspace.types';
import { getWorkspace, updateWorkspace, searchWorkspace } from '../services/workspace.service';
import { useDebounce } from './useDebounce';

const defaultRoot: FileNode[] = [
  {
    id: 'root',
    name: 'My Project',
    type: 'folder',
    children: [],
  },
];

export const useWorkspace = () => {
  const [root, setRoot] = useState<FileNode[]>(defaultRoot);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [activeFileLanguage, setActiveFileLanguage] = useState<string>('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; type: string; path: string; language?: string }>>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const findNodeById = useCallback((nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const persistWorkspace = useCallback(async (rootData: FileNode[]) => {
    setIsLoading(true);
    try {
      await updateWorkspace(rootData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveFile = useCallback((fileId: string | null) => {
    if (!fileId) {
      setCurrentFileId(null);
      setActiveFileContent('');
      return;
    }
    const file = findNodeById(root, fileId);
    if (file && file.type === 'file') {
      setCurrentFileId(fileId);
      setActiveFileContent(file.content ?? '');
      setActiveFileLanguage(file.language ?? 'plaintext');
    }
  }, [findNodeById, root]);

  const updateCurrentFileContent = (content: string) => {
    if (!currentFileId) return;
    const updateNode = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.id === currentFileId && node.type === 'file') {
          return { ...node, content };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });

    const updatedRoot = updateNode(root);
    setRoot(updatedRoot);
    setActiveFileContent(content);
  };

  const updateCurrentFileLanguage = (language: string) => {
    if (!currentFileId) return;
    const updateNode = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.id === currentFileId && node.type === 'file') {
          return { ...node, language };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });

    setRoot(updateNode(root));
    setActiveFileLanguage(language);
  };

  const renameNode = (nodeId: string, newName: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, name: newName };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });

    setRoot(updateNode(root));
  };

  const deleteNode = (nodeId: string) => {
    const removeNode = (nodes: FileNode[]): FileNode[] =>
      nodes.filter((node) => {
        if (node.id === nodeId) return false;
        if (node.children) {
          node.children = removeNode(node.children);
        }
        return true;
      });

    setRoot(removeNode(root));
    if (currentFileId === nodeId) {
      setActiveFileContent('');
      setCurrentFileId(null);
    }
  };

  const createNode = (parentId: string | null, node: FileNode) => {
    const insertNode = (nodes: FileNode[]): FileNode[] =>
      nodes.map((item) => {
        if (item.id === parentId && item.type === 'folder') {
          const children = item.children ?? [];
          return { ...item, children: [...children, node] };
        }
        if (item.children) {
          return { ...item, children: insertNode(item.children) };
        }
        return item;
      });

    if (!parentId) {
      setRoot((prev) => [...prev, node]);
      return;
    }

    setRoot((prev) => insertNode(prev));
  };

  const findFirstFile = useCallback((nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const loadWorkspace = async () => {
      setIsLoading(true);
      try {
        const workspace = await getWorkspace();
        const loadedRoot = workspace.root.length ? workspace.root : defaultRoot;
        setRoot(loadedRoot);
        const firstFile = findFirstFile(loadedRoot);
        if (firstFile) {
          setActiveFile(firstFile.id);
        }
      } catch (error) {
        console.error('Failed to load workspace', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [findFirstFile, setActiveFile]);

  useEffect(() => {
    if (!currentFileId || !root.length) return;
    const file = findNodeById(root, currentFileId);
    if (file && file.type === 'file') {
      setActiveFileContent(file.content ?? '');
      setActiveFileLanguage(file.language ?? 'plaintext');
    }
  }, [currentFileId, findNodeById, root]);

  useEffect(() => {
    if (!debouncedSearchQuery) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        const results = await searchWorkspace(debouncedSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Workspace search failed', error);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      persistWorkspace(root);
    }, 700);

    return () => clearTimeout(timeout);
  }, [persistWorkspace, root]);

  return {
    root,
    currentFileId,
    activeFileContent,
    activeFileLanguage,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    setRoot,
    setActiveFile,
    setActiveFileContent,
    setActiveFileLanguage,
    updateCurrentFileContent,
    updateCurrentFileLanguage,
    createNode,
    renameNode,
    deleteNode,
    persistWorkspace,
  };
};
