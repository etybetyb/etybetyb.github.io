import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onUpdate?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 25, onComplete, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // 若速度為 0 或更小，則立即顯示文字
    if (speed <= 0) {
      setDisplayedText(text);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    setDisplayedText(''); // 當文字變更時重置
    let frameId: number;
    let startTime: number;
    let lastCharIndex = -1;

    const type = (currentTime: number) => {
      if (startTime === undefined) {
        startTime = currentTime;
      }
      const elapsed = currentTime - startTime;
      const currentCharIndex = Math.min(Math.floor(elapsed / speed), text.length);
      
      // 只有在索引增加時才更新狀態，以避免不必要的重新渲染
      if (currentCharIndex > lastCharIndex) {
        setDisplayedText(text.substring(0, currentCharIndex));
        lastCharIndex = currentCharIndex;
      }

      if (currentCharIndex < text.length) {
        frameId = requestAnimationFrame(type);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    frameId = requestAnimationFrame(type);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [text, speed, onComplete]);

  // 此 effect 會在 DOM 更新新文字後呼叫 onUpdate 回呼。
  // 這對於父元件能否正確捲動至關重要。
  useEffect(() => {
    if (onUpdate) {
      onUpdate();
    }
  }, [displayedText, onUpdate]);

  return <span>{displayedText}</span>;
};

export default Typewriter;
