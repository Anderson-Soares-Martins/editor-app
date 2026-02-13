import { useState, useRef, useEffect } from 'react';
import { useToolStore } from '@/store';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  type: 'fill' | 'stroke';
}

const PRESET_COLORS = [
  '#ffffff',
  '#000000',
  '#4a9eff',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#E74C3C',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
];

export function ColorPicker({ type }: ColorPickerProps) {
  const { fillColor, strokeColor, setFillColor, setStrokeColor } = useToolStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const color = type === 'fill' ? fillColor : strokeColor;
  const setColor = type === 'fill' ? setFillColor : setStrokeColor;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const label = type === 'fill' ? 'Fill' : 'Stroke';

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${label} color: ${color}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div
          className={styles.colorPreview}
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {type === 'stroke' && (
            <div className={styles.strokeIndicator} />
          )}
        </div>
        <span className={styles.label}>{label}</span>
      </button>

      {isOpen && (
        <div
          className={styles.dropdown}
          role="dialog"
          aria-label={`${label} color picker`}
        >
          <div className={styles.presetColors} role="listbox" aria-label="Preset colors">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                className={`${styles.presetColor} ${color === presetColor ? styles.selected : ''}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  setColor(presetColor);
                  setIsOpen(false);
                }}
                aria-label={`Color ${presetColor}`}
                aria-selected={color === presetColor}
                role="option"
              />
            ))}
          </div>
          <div className={styles.customColor}>
            <label htmlFor={`${type}-color-picker`}>Custom:</label>
            <input
              id={`${type}-color-picker`}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Custom color picker"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.hexInput}
              aria-label="Hex color value"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}
