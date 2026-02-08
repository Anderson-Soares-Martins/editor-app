import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Minus,
  Type,
  ImageIcon,
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import { useToolStore, useHistoryStore, useCanvasStore } from '@/store';
import { useHistory } from '@/hooks/useHistory';
import { useExport } from '@/hooks/useExport';
import type { Tool } from '@editor-app/shared';
import styles from './Toolbar.module.css';
import { ColorPicker } from './ColorPicker';

interface ToolButtonProps {
  tool: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ tool, icon, label, shortcut }: ToolButtonProps) {
  const { activeTool, setTool } = useToolStore();
  const isActive = activeTool === tool;

  return (
    <button
      className={`${styles.toolButton} ${isActive ? styles.active : ''}`}
      onClick={() => setTool(tool)}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      {icon}
    </button>
  );
}

export function Toolbar() {
  const { undo, redo } = useHistory();
  const { canUndo, canRedo } = useHistoryStore();
  const { exportToPNG, exportToSVG } = useExport();
  const { viewport, zoomTo, fitToScreen } = useCanvasStore();

  const handleZoomIn = () => {
    zoomTo(viewport.scale * 1.2);
  };

  const handleZoomOut = () => {
    zoomTo(viewport.scale / 1.2);
  };

  const handleFitToScreen = () => {
    fitToScreen(window.innerWidth - 560, window.innerHeight - 48);
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.section}>
        <ToolButton
          tool="select"
          icon={<MousePointer2 size={18} />}
          label="Select"
          shortcut="V"
        />
        <ToolButton
          tool="pan"
          icon={<Hand size={18} />}
          label="Pan"
          shortcut="H"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <ToolButton
          tool="rectangle"
          icon={<Square size={18} />}
          label="Rectangle"
          shortcut="R"
        />
        <ToolButton
          tool="circle"
          icon={<Circle size={18} />}
          label="Circle"
          shortcut="O"
        />
        <ToolButton
          tool="line"
          icon={<Minus size={18} />}
          label="Line"
          shortcut="L"
        />
        <ToolButton
          tool="text"
          icon={<Type size={18} />}
          label="Text"
          shortcut="T"
        />
        <ToolButton
          tool="image"
          icon={<ImageIcon size={18} />}
          label="Image"
          shortcut="I"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <ColorPicker type="fill" />
        <ColorPicker type="stroke" />
      </div>

      <div className={styles.spacer} />

      <div className={styles.section}>
        <button
          className={styles.toolButton}
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          className={styles.toolButton}
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <button
          className={styles.toolButton}
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <span className={styles.zoomLevel}>{Math.round(viewport.scale * 100)}%</span>
        <button
          className={styles.toolButton}
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          className={styles.toolButton}
          onClick={handleFitToScreen}
          title="Fit to Screen"
        >
          <Maximize size={18} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <button
          className={styles.toolButton}
          onClick={exportToPNG}
          title="Export as PNG"
        >
          <Download size={18} />
          <span className={styles.buttonLabel}>PNG</span>
        </button>
        <button
          className={styles.toolButton}
          onClick={exportToSVG}
          title="Export as SVG"
        >
          <Download size={18} />
          <span className={styles.buttonLabel}>SVG</span>
        </button>
      </div>
    </div>
  );
}
