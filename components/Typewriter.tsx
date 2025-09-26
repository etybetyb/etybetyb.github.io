import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onUpdate?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 25, onComplete, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when the text prop changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  // The core typewriter effect logic
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      // Ensure onComplete is only called once
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);
  
  // This effect calls the onUpdate callback after the DOM has been updated with new text.
  // This is crucial for the parent component to be able to scroll correctly.
  useEffect(() => {
    if (onUpdate) {
      onUpdate();
    }
  }, [displayedText, onUpdate]);

  return <span>{displayedText}</span>;
};

export default Typewriter;