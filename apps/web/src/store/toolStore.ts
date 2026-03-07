import { create } from 'zustand';
import type { Tool } from '@editor-app/shared';

interface ToolStore {
  activeTool: Tool;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  snapToGrid: boolean;

  setTool: (tool: Tool) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setSnapToGrid: (snap: boolean) => void;
}

export const useToolStore = create<ToolStore>((set) => ({
  activeTool: 'select',
  fillColor: '#4a9eff',
  strokeColor: '#ffffff',
  strokeWidth: 0,
  fontSize: 24,
  fontFamily: 'Arial',
  snapToGrid: true,

  setTool: (tool) => set({ activeTool: tool }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
}));
