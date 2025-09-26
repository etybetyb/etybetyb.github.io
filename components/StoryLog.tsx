import React, { useEffect, useRef } from 'react';
import { StoryStep } from '../types';
import Typewriter from './Typewriter';

interface StoryLogProps {
  storyLog: StoryStep[];
  onTypingComplete: () => void;
}

const StoryLog: React.FC<StoryLogProps> = ({ storyLog, onTypingComplete }) => {
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollableContainerRef.current) {
      // Using smooth scrolling via CSS for better user experience
      scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  };
  
  // This effect handles the initial scroll when new, non-typewriter content is added,
  // and sets up the container for the typewriter.
  useEffect(() => {
    scrollToBottom();
  }, [storyLog]);

  return (
    <div 
      ref={scrollableContainerRef} 
      className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 -mr-4"
      style={{scrollBehavior: 'smooth'}}
    >
      {storyLog.map((step, index) => {
        const isLastStep = index === storyLog.length - 1;

        if (step.type === 'scene') {
          return (
            <div key={index} className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
              {isLastStep ? (
                <Typewriter text={step.content} onComplete={onTypingComplete} onUpdate={scrollToBottom} />
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
    </div>
  );
};

export default StoryLog;