import React, { useEffect, useRef } from 'react';
import { StoryStep } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyLog: StoryStep[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, storyLog }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Scroll to the bottom when the modal opens
      setTimeout(() => {
        modalContentRef.current?.scrollTo(0, modalContentRef.current.scrollHeight);
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl border border-slate-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-600 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-2xl font-bold text-cyan-300">冒險日誌</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div ref={modalContentRef} className="p-6 overflow-y-auto space-y-6">
          {storyLog.map((step, index) => {
            if (step.type === 'scene') {
              return (
                <div key={index} className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {step.content}
                </div>
              );
            }
            if (step.type === 'choice') {
              return (
                <React.Fragment key={index}>
                  <div className="text-right">
                    <p className="inline-block bg-cyan-900/50 text-cyan-200 italic px-4 py-2 rounded-lg border border-cyan-800">
                      &gt; {step.content}
                    </p>
                  </div>
                  <hr className="thematic-divider" />
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
