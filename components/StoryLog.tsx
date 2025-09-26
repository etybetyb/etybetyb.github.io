
import React, { useEffect, useRef } from 'react';
import { StoryStep } from '../types';

interface StoryLogProps {
  storyLog: StoryStep[];
}

const StoryLog: React.FC<StoryLogProps> = ({ storyLog }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyLog]);

  return (
    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 -mr-4">
      {storyLog.map((step, index) => {
        if (step.type === 'scene') {
          return (
            <div key={index} className="text-slate-300 text-lg leading-relaxed animate-fade-in whitespace-pre-wrap">
              {step.content}
            </div>
          );
        }
        if (step.type === 'choice') {
          return (
            <div key={index} className="text-right animate-fade-in">
              <p className="inline-block bg-cyan-900/50 text-cyan-200 italic px-4 py-2 rounded-lg border border-cyan-800">
                &gt; {step.content}
              </p>
            </div>
          );
        }
        return null;
      })}
      <div ref={endOfLogRef} />
    </div>
  );
};

export default StoryLog;
