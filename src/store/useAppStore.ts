import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, PDFTool } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTool: null,
      files: [],
      history: [],
      isProcessing: false,
      darkMode: true,
      
      setActiveTool: (tool) => set({ activeTool: tool }),
      
      addFiles: (newFiles) => set((state) => ({ 
        files: [...state.files, ...newFiles] 
      })),
      
      removeFile: (id) => set((state) => ({ 
        files: state.files.filter(f => f.id !== id) 
      })),

      reorderFiles: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.files.length ||
            toIndex >= state.files.length ||
            fromIndex === toIndex
          ) {
            return state
          }
          const nextFiles = [...state.files]
          const [moved] = nextFiles.splice(fromIndex, 1)
          if (!moved) {
            return state
          }
          nextFiles.splice(toIndex, 0, moved)
          return { files: nextFiles }
        }),
      
      clearFiles: () => set({ files: [] }),
      
      updateFileStatus: (id, status, progress) => set((state) => ({
        files: state.files.map(f => 
          f.id === id ? { ...f, status, progress: progress ?? f.progress } : f
        )
      })),
      
      addHistory: (item) => set((state) => ({ 
        history: [item, ...state.history].slice(0, 50) 
      })),

      clearHistory: () => set({ history: [] }),
      
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'nebulapdf-storage',
      partialize: (state) => ({ history: state.history, darkMode: state.darkMode }),
    }
  )
);

export const TOOL_CONFIG: Record<PDFTool, { name: string; description: string; color: string; category: string }> = {
  merge: { 
    name: 'Merge PDF', 
    description: 'Combine multiple PDFs into a single document',
    color: 'from-violet-500 to-purple-600',
    category: 'basic'
  },
  split: { 
    name: 'Split PDF', 
    description: 'Extract pages or split into multiple PDFs',
    color: 'from-blue-500 to-cyan-600',
    category: 'basic'
  },
  compress: { 
    name: 'Compress PDF', 
    description: 'Reduce file size while maintaining quality',
    color: 'from-emerald-500 to-teal-600',
    category: 'basic'
  },
  convert: { 
    name: 'Convert to PDF', 
    description: 'Convert images and existing PDFs into one PDF',
    color: 'from-orange-500 to-amber-600',
    category: 'convert'
  },
  'pdf-to-jpg': { 
    name: 'PDF to JPG', 
    description: 'Extract images from PDF pages',
    color: 'from-pink-500 to-rose-600',
    category: 'convert'
  },
  organize: { 
    name: 'Organize PDF', 
    description: 'Reorder, rotate, delete pages',
    color: 'from-indigo-500 to-blue-600',
    category: 'advanced'
  },
  edit: { 
    name: 'Edit PDF', 
    description: 'Add visible text annotations and edit marks',
    color: 'from-cyan-500 to-sky-600',
    category: 'advanced'
  },
  protect: { 
    name: 'Protect PDF', 
    description: 'Password protection with advanced encryption',
    color: 'from-red-500 to-pink-600',
    category: 'security'
  },
  sign: { 
    name: 'Digital Sign', 
    description: 'Apply a visible electronic signature block',
    color: 'from-lime-500 to-green-600',
    category: 'security'
  },
  ocr: { 
    name: 'Extract Text', 
    description: 'Extract selectable text from PDF pages',
    color: 'from-amber-500 to-yellow-600',
    category: 'advanced'
  },
};
