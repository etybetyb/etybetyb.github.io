
import React, { useState, useCallback } from 'react';
import { GameState, StoryStep, Choice } from './types';
import { generateAdventureStep } from './services/geminiService';
import ThemeSelector from './components/ThemeSelector';
import GameScreen from './components/GameScreen';
import ApiKeyInput from './components/ApiKeyInput';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => sessionStorage.getItem('gemini-api-key'));
  const [gameState, setGameState] = useState<GameState>(GameState.THEME_SELECTION);
  const [storyLog, setStoryLog] = useState<StoryStep[]>([]);
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverMessage, setGameOverMessage] = useState<string>('');

  const handleKeySubmit = (key: string) => {
    sessionStorage.setItem('gemini-api-key', key);
    setApiKey(key);
  };

  const handleStartGame = useCallback(async (theme: string) => {
    if (!apiKey) {
        setError('API 金鑰未設定。');
        return;
    }
    setIsLoading(true);
    setError(null);
    setGameState(GameState.PLAYING);
    setStoryLog([]);
    setIsGameOver(false);
    setGameOverMessage('');

    try {
      const initialHistory: StoryStep[] = [{ type: 'theme', content: theme }];
      const result = await generateAdventureStep(apiKey, initialHistory);
      
      setStoryLog([{ type: 'scene', content: result.sceneDescription }]);
      setCurrentChoices(result.choices);

      if (result.isGameOver) {
        setIsGameOver(true);
        setGameOverMessage(result.gameOverMessage || '冒險結束了。');
      }
    } catch (err) {
      setError('無法開始冒險。請檢查您的 API 金鑰或稍後再試。');
      setGameState(GameState.THEME_SELECTION);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleMakeChoice = useCallback(async (choice: string) => {
    if (!apiKey) {
        setError('API 金鑰未設定。');
        return;
    }
    setIsLoading(true);
    setError(null);
    
    const newHistory: StoryStep[] = [...storyLog, { type: 'choice', content: choice }];
    setStoryLog(newHistory);
    setCurrentChoices([]);

    try {
      const result = await generateAdventureStep(apiKey, newHistory);
      setStoryLog(prevLog => [...prevLog, { type: 'scene', content: result.sceneDescription }]);
      
      if (result.isGameOver) {
        setIsGameOver(true);
        setGameOverMessage(result.gameOverMessage || '冒險結束了。');
        setCurrentChoices([]);
      } else {
        setCurrentChoices(result.choices);
      }
    } catch (err) {
      setError('發生了意想不到的事件，故事無法繼續。');
      setIsGameOver(true);
      setGameOverMessage('與故事的連結已中斷。');
    } finally {
      setIsLoading(false);
    }
  }, [storyLog, apiKey]);

  const handleRestart = () => {
    setGameState(GameState.THEME_SELECTION);
    setStoryLog([]);
    setCurrentChoices([]);
    setIsLoading(false);
    setError(null);
    setIsGameOver(false);
    setGameOverMessage('');
  };

  const renderContent = () => {
    if (!apiKey) {
        return <ApiKeyInput onKeySubmit={handleKeySubmit} />;
    }

    switch (gameState) {
      case GameState.THEME_SELECTION:
        return <ThemeSelector onStart={handleStartGame} isLoading={isLoading} />;
      case GameState.PLAYING:
        return (
          <GameScreen
            storyLog={storyLog}
            choices={currentChoices}
            isLoading={isLoading}
            isGameOver={isGameOver}
            gameOverMessage={gameOverMessage}
            error={error}
            onMakeChoice={handleMakeChoice}
            onRestart={handleRestart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen antialiased">
      <main className="container mx-auto max-w-3xl p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider" style={{ fontFamily: "'Crimson Text', serif" }}>
            Gemini 冒險紀元
          </h1>
          <p className="text-slate-400 mt-2">一個由 AI 驅動的文字冒險遊戲</p>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
