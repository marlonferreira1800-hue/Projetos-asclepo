import React from 'react';
import { useBrowserStore } from '../store';
import { EffortLevel } from '../types';

interface EffortPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EffortPopover: React.FC<EffortPopoverProps> = ({ isOpen, onClose }) => {
  const { effort, setEffort } = useBrowserStore();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effortMap: Record<number, EffortLevel> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Max'
  };

  const reverseMap: Record<EffortLevel, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Max: 4
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setEffort(effortMap[val] || 'Medium');
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-10 left-0 w-64 bg-white border border-cardBorder rounded-xl p-3 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-textPrimary">
            Effort <strong>{effort}</strong>
          </span>
          {effort === 'Medium' && (
            <span className="text-[10px] bg-sidebarHover text-textSecondary px-1.5 py-0.5 rounded">
              Default
            </span>
          )}
        </div>
        <p className="text-[11px] text-textMuted mb-3">For everyday tasks</p>

        <input
          type="range"
          min="1"
          max="4"
          value={reverseMap[effort]}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-sidebarBorder rounded-lg appearance-none cursor-pointer accent-polarBlue"
        />
        <div className="flex justify-between text-[10px] text-textMuted mt-1 font-mono">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Max</span>
        </div>
      </div>
    </>
  );
};
