import React, { useEffect, useRef } from 'react';
import { StoryStep } from '../types';
import Typewriter from './Typewriter';

interface StoryLogProps {
  storyLog: StoryStep[];
  onTypingComplete: () => void;
}

const StoryLog: React.FC<StoryLogProps> = ({ storyLog, onTypingComplete }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyLog]);

  return (
    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 -mr-4">
      {storyLog.map((step, index) => {
        const isLastStep = index === storyLog.length - 1;

        if (step.type === 'scene') {
          return (
            <div key={index} className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
              {isLastStep ? (
                <Typewriter text={step.content} onComplete={onTypingComplete} />
              ) : (
                step.content
              )}
            </div>
          );
        }
        if (step.type === 'choice') {
          return (
            <React.Fragment key={index}>
              <div className="text-right animate-fade-in">
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
      <div ref={endOfLogRef} />
    </div>
  );
};

export default StoryLog;