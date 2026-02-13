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
      data-tooltip={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={`${label}${shortcut ? `, shortcut ${shortcut}` : ''}`}
      aria-pressed={isActive}
      role="button"
    >
      {icon}
    </button>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function ActionButton({ icon, label, shortcut, onClick, disabled, children }: ActionButtonProps) {
  return (
    <button
      className={styles.toolButton}
      onClick={onClick}
      disabled={disabled}
      data-tooltip={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={`${label}${shortcut ? `, shortcut ${shortcut}` : ''}`}
    >
      {icon}
      {children}
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
    <nav className={styles.toolbar} role="toolbar" aria-label="Canvas tools">
      <div className={styles.section} role="group" aria-label="Selection tools">
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

      <div className={styles.divider} role="separator" aria-hidden="true" />

      <div className={styles.section} role="group" aria-label="Shape tools">
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

      <div className={styles.divider} role="separator" aria-hidden="true" />

      <div className={styles.section} role="group" aria-label="Color controls">
        <ColorPicker type="fill" />
        <ColorPicker type="stroke" />
      </div>

      <div className={styles.spacer} />

      <div className={styles.section} role="group" aria-label="History">
        <ActionButton
          icon={<Undo2 size={18} />}
          label="Undo"
          shortcut="⌘Z"
          onClick={undo}
          disabled={!canUndo()}
        />
        <ActionButton
          icon={<Redo2 size={18} />}
          label="Redo"
          shortcut="⌘⇧Z"
          onClick={redo}
          disabled={!canRedo()}
        />
      </div>

      <div className={styles.divider} role="separator" aria-hidden="true" />

      <div className={styles.section} role="group" aria-label="Zoom controls">
        <ActionButton
          icon={<ZoomOut size={18} />}
          label="Zoom Out"
          shortcut="-"
          onClick={handleZoomOut}
        />
        <span className={styles.zoomLevel} aria-live="polite" aria-label={`Zoom level ${Math.round(viewport.scale * 100)} percent`}>
          {Math.round(viewport.scale * 100)}%
        </span>
        <ActionButton
          icon={<ZoomIn size={18} />}
          label="Zoom In"
          shortcut="+"
          onClick={handleZoomIn}
        />
        <ActionButton
          icon={<Maximize size={18} />}
          label="Fit to Screen"
          shortcut="⌘0"
          onClick={handleFitToScreen}
        />
      </div>

      <div className={styles.divider} role="separator" aria-hidden="true" />

      <div className={styles.section} role="group" aria-label="Export">
        <ActionButton
          icon={<Download size={18} />}
          label="Export as PNG"
          onClick={exportToPNG}
        >
          <span className={styles.buttonLabel}>PNG</span>
        </ActionButton>
        <ActionButton
          icon={<Download size={18} />}
          label="Export as SVG"
          onClick={exportToSVG}
        >
          <span className={styles.buttonLabel}>SVG</span>
        </ActionButton>
      </div>
    </nav>
  );
}
