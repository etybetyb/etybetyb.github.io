import React from 'react';
import LoadingIcon from './LoadingIcon';

interface InspirationLoadingModalProps {
  isOpen: boolean;
}

const InspirationLoadingModal: React.FC<InspirationLoadingModalProps> = ({ isOpen }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-fast backdrop-blur-sm">
      <div className="bg-slate-800/80 p-6 rounded-lg shadow-2xl border border-slate-700 flex items-center justify-center">
        <LoadingIcon />
        <span className="ml-4 text-lg text-slate-300">靈感生成中...</span>
      </div>
    </div>
  );
};

export default InspirationLoadingModal;
