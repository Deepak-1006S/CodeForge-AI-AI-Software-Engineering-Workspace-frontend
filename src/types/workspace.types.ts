export type FileNodeType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  language?: string;
  content?: string;
  children?: FileNode[];
}

export interface Workspace {
  _id: string;
  user: string;
  root: FileNode[];
  createdAt: string;
  updatedAt: string;
}
