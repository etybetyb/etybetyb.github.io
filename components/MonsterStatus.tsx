

import React, { useState } from 'react';
import { MonsterState } from '../types';

interface MonsterStatusProps {
  monsters: MonsterState[];
}

const MonsterStatus: React.FC<MonsterStatusProps> = ({ monsters }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!monsters || monsters.length === 0) {
    return null; // 如果沒有怪物，則不渲染任何內容
  }

  return (
    <div className="bg-red-900/20 p-6 rounded-lg shadow-2xl border border-red-700/50 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-red-300 mb-4 border-b border-red-600/50 pb-2">遭遇威脅</h3>
      <div className="space-y-6">
        {monsters.map((monster, index) => (
          <div key={index}>
            <button
              onClick={() => handleToggle(index)}
              className="w-full text-left flex justify-between items-center group"
              aria-expanded={expandedIndex === index}
            >
              <h4 className="text-lg font-semibold text-red-200 group-hover:text-red-100 transition-colors">{monster.name}</h4>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-red-300/80 transition-transform duration-300 ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            
            {expandedIndex === index && monster.description && (
              <div className="mt-2 pl-2 border-l-2 border-red-500/30 animate-fade-in-fast">
                <p className="text-sm text-red-200/90 italic whitespace-pre-wrap">{monster.description}</p>
              </div>
            )}

            {Object.keys(monster.attributes).length > 0 && (
              <ul className="space-y-1 text-red-300/80 mt-2">
                {Object.entries(monster.attributes).map(([key, value]) => (
                  <li key={key} className="flex justify-between items-center text-sm">
                    <span>{key}:</span>
                    <span className="font-mono font-bold text-red-200">{value}</span>
                  </li>
                ))}
              </ul>
            )}
            {index < monsters.length - 1 && <hr className="border-t border-red-600/30 mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonsterStatus;