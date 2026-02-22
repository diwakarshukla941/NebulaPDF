export type PDFTool = 
  | 'merge'
  | 'split'
  | 'compress'
  | 'convert'
  | 'pdf-to-jpg'
  | 'organize'
  | 'edit'
  | 'protect'
  | 'sign'
  | 'ocr';

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  file: File;
  preview?: string;
  pages?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}

export interface ToolConfig {
  id: PDFTool;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'convert' | 'advanced' | 'security';
  color: string;
}

export interface HistoryItem {
  id: string;
  tool: PDFTool;
  fileName: string;
  timestamp: Date;
  status: 'success' | 'error';
  outputSize?: number;
}

export interface AppState {
  activeTool: PDFTool | null;
  files: PDFFile[];
  history: HistoryItem[];
  isProcessing: boolean;
  darkMode: boolean;
  setActiveTool: (tool: PDFTool | null) => void;
  addFiles: (files: PDFFile[]) => void;
  removeFile: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  clearFiles: () => void;
  updateFileStatus: (id: string, status: PDFFile['status'], progress?: number) => void;
  addHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  toggleDarkMode: () => void;
}
