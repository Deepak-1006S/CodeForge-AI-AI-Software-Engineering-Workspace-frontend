import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  currentFile: string | null;
  onFileSelect: (fileId: string) => void;
  onCreateFile: (parentId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  currentFile,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClass = 'w-4 h-4';

    switch (ext) {
      case 'js':
      case 'jsx':
        return <FileCode className={`${iconClass} text-yellow-400`} />;
      case 'ts':
      case 'tsx':
        return <FileCode className={`${iconClass} text-blue-400`} />;
      case 'py':
        return <FileCode className={`${iconClass} text-green-400`} />;
      case 'html':
        return <FileCode className={`${iconClass} text-orange-400`} />;
      case 'css':
      case 'scss':
        return <FileCode className={`${iconClass} text-purple-400`} />;
      case 'json':
        return <FileCode className={`${iconClass} text-amber-400`} />;
      case 'md':
        return <FileCode className={`${iconClass} text-sky-400`} />;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  const renderNode = (node: FileNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = currentFile === node.id;

    return (
      <div key={node.id}>
        <motion.div
          whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              onFileSelect(node.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-300 hover:text-white'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
            </>
          ) : (
            <div className="ml-3">{getFileIcon(node.name)}</div>
          )}
          <span className="text-sm truncate">{node.name}</span>
        </motion.div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const createNodeInRoot = () => onCreateFolder(null);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 bg-gray-850 border-b border-gray-800 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Explorer</h3>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCreateFile(null)}
            className="p-1 rounded hover:bg-gray-800 transition-colors"
            title="New file"
          >
            <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCreateFolder(null)}
            className="p-1 rounded hover:bg-gray-800 transition-colors"
            title="New folder"
          >
            <Folder className="w-4 h-4 text-gray-400 hover:text-white" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {files.length > 0 ? (
          files.map((node) => renderNode(node))
        ) : (
          <div className="px-4 py-6 text-center">
            <Folder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No files yet</p>
            <p className="text-xs text-gray-600">Create a new file or folder to get started.</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            type="button"
            onClick={() => {
              const newName = window.prompt('Rename file or folder', '');
              if (newName) {
                onRename(contextMenu.nodeId, newName.trim());
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <Edit className="w-3 h-3" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this item?')) {
                onDelete(contextMenu.nodeId);
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </motion.div>
      )}
    </div>
  );
};
