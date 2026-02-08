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

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title={type === 'fill' ? 'Fill Color' : 'Stroke Color'}
      >
        <div
          className={styles.colorPreview}
          style={{ backgroundColor: color }}
        >
          {type === 'stroke' && (
            <div className={styles.strokeIndicator} />
          )}
        </div>
        <span className={styles.label}>{type === 'fill' ? 'Fill' : 'Stroke'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.presetColors}>
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                className={`${styles.presetColor} ${color === presetColor ? styles.selected : ''}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  setColor(presetColor);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
          <div className={styles.customColor}>
            <label>Custom:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.hexInput}
            />
          </div>
        </div>
      )}
    </div>
  );
}
