import apiClient from './api';
import type { FileNode, Workspace } from '../types/workspace.types';

export const getWorkspace = async (): Promise<Workspace> => {
  const response = await apiClient.get('/workspace');
  return response.data.data.workspace;
};

export const updateWorkspace = async (root: FileNode[]): Promise<Workspace> => {
  const response = await apiClient.patch('/workspace', { root });
  return response.data.data.workspace;
};

export const searchWorkspace = async (query: string): Promise<Array<{ id: string; name: string; type: string; path: string; language?: string }>> => {
  const response = await apiClient.get('/workspace/search', { params: { q: query } });
  return response.data.data.results;
};
