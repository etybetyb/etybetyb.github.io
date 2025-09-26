
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, StoryStep, Choice, PlayerState, PlayerStateUpdate, CharacterAttributes, SaveData } from './types';
import { generateAdventureStep, validateApiKey, ApiKeyError } from './services/geminiService';
import { saveGame, loadGame, clearSave } from './services/storageService';
import ThemeSelector from './components/ThemeSelector';
import GameScreen from './components/GameScreen';
import HistoryModal from './components/HistoryModal';
import ApiKeyInput from './components/ApiKeyInput';
import HomePage from './components/HomePage';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [storyLog, setStoryLog] = useState<StoryStep[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverMessage, setGameOverMessage] = useState<string>('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);

  // New states for key validation
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);


  useEffect(() => {
    const storedKey = sessionStorage.getItem('gemini-api-key');
    if (storedKey) {
        setApiKey(storedKey);
    }
    if (loadGame()) {
      setHasSaveData(true);
    }
  }, []);

  const resetState = useCallback(() => {
    setGameState(GameState.HOME);
    setStoryLog([]);
    setCurrentChoices([]);
    setPlayerState(null);
    setIsLoading(false);
    setError(null);
    setIsGameOver(false);
    setGameOverMessage('');
    setIsHistoryModalOpen(false);
  }, []);

  const handleKeySubmit = useCallback(async (key: string) => {
    setIsVerifyingKey(true);
    setKeyError(null);
    const isValid = await validateApiKey(key);
    setIsVerifyingKey(false);

    if (isValid) {
      sessionStorage.setItem('gemini-api-key', key);
      setApiKey(key);
      resetState();
    } else {
      setKeyError('API 金鑰無效或無法驗證。請檢查金鑰並重試。');
    }
  }, [resetState]);
  
  const handleChangeKey = useCallback((errorMessage?: string) => {
    sessionStorage.removeItem('gemini-api-key');
    clearSave();
    setHasSaveData(false);
    setApiKey(null);
    resetState();
    if (errorMessage) {
      setKeyError(errorMessage);
    }
  }, [resetState]);

  const handleNewGame = () => {
    clearSave();
    setHasSaveData(false);
    resetState();
    setGameState(GameState.THEME_SELECTION);
  };

  const handleContinueGame = () => {
    const savedData = loadGame();
    if (savedData) {
      setStoryLog(savedData.storyLog);
      setPlayerState(savedData.playerState);
      setCurrentChoices(savedData.currentChoices);
      setIsGameOver(savedData.isGameOver);
      setGameOverMessage(savedData.gameOverMessage);
      setGameState(GameState.PLAYING);
    }
  };

  const applyStateUpdate = (update: PlayerStateUpdate) => {
    setPlayerState(prevState => {
      const baseState = prevState || { attributes: {}, inventory: [] };
      const newAttributes: CharacterAttributes = { ...baseState.attributes };

      if (update.setAttributes) {
        update.setAttributes.forEach(attr => {
          const numValue = parseFloat(attr.value);
          newAttributes[attr.key] = isNaN(numValue) ? attr.value : numValue;
        });
      }

      let newInventory = [...baseState.inventory];
      if (update.addItems) {
        newInventory.push(...update.addItems);
      }
      if (update.removeItems) {
        newInventory = newInventory.filter(
          item => !update.removeItems?.includes(item.name)
        );
      }
      
      return {
        attributes: newAttributes,
        inventory: newInventory
      };
    });
  }

  const handleStartGame = useCallback(async (theme: string) => {
    if (!apiKey) {
      setError("API 金鑰未設定。");
      return;
    }
    setIsLoading(true);
    setError(null);
    clearSave();
    setHasSaveData(false);
    setStoryLog([]);
    setPlayerState(null);
    setIsGameOver(false);
    setGameOverMessage('');
    
    setGameState(GameState.PLAYING);

    try {
      const initialHistory: StoryStep[] = [{ type: 'theme', content: theme }];
      const result = await generateAdventureStep(initialHistory, null, apiKey);
      
      const newStoryLog: StoryStep[] = [{ type: 'scene', content: result.sceneDescription }];
      setStoryLog(newStoryLog);
      setCurrentChoices(result.choices);

      let newPlayerState: PlayerState | null = null;
      if (result.playerStateUpdate) {
        // This is a bit tricky because setPlayerState is async.
        // We'll calculate the new state directly for saving.
        const baseState = { attributes: {}, inventory: [] };
        if (result.playerStateUpdate.setAttributes) {
          result.playerStateUpdate.setAttributes.forEach(attr => {
            const numValue = parseFloat(attr.value);
            baseState.attributes[attr.key] = isNaN(numValue) ? attr.value : numValue;
          });
        }
        if (result.playerStateUpdate.addItems) {
          baseState.inventory.push(...result.playerStateUpdate.addItems);
        }
        newPlayerState = baseState;
        setPlayerState(newPlayerState);
      }

      if (result.isGameOver) {
        setIsGameOver(true);
        setGameOverMessage(result.gameOverMessage || '冒險結束了。');
      }

      // Save initial state
      const saveData: SaveData = {
        storyLog: newStoryLog,
        playerState: newPlayerState,
        currentChoices: result.choices,
        isGameOver: result.isGameOver || false,
        gameOverMessage: result.gameOverMessage || '',
      };
      saveGame(saveData);
      setHasSaveData(true);

    } catch (err) {
      if (err instanceof ApiKeyError) {
        handleChangeKey('您的 API 金鑰無效或已過期，請重新輸入。');
      } else {
        setError(err instanceof Error ? err.message : '無法與說書人建立聯繫。請稍後再試。');
        setGameState(GameState.THEME_SELECTION);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, handleChangeKey]);

  const handleMakeChoice = useCallback(async (choice: string) => {
    if (!apiKey) {
      setError("API 金鑰未設定。");
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const choiceStep: StoryStep = { type: 'choice', content: choice };
    const newHistory: StoryStep[] = [...storyLog, choiceStep];
    setStoryLog(newHistory);
    setCurrentChoices([]);

    try {
      const result = await generateAdventureStep(newHistory, playerState, apiKey);
      
      // FIX: Explicitly type finalStoryLog to prevent TypeScript from widening the
      // 'type' property of the new scene object to 'string'.
      const finalStoryLog: StoryStep[] = [...newHistory, { type: 'scene', content: result.sceneDescription }];
      setStoryLog(finalStoryLog);
      
      let updatedPlayerState = playerState;
      if (result.playerStateUpdate) {
        // Manually calculate the next state for saving because setState is async
        const baseState = playerState || { attributes: {}, inventory: [] };
        const newAttributes: CharacterAttributes = { ...baseState.attributes };
        if (result.playerStateUpdate.setAttributes) {
          result.playerStateUpdate.setAttributes.forEach(attr => {
            const numValue = parseFloat(attr.value);
            newAttributes[attr.key] = isNaN(numValue) ? attr.value : numValue;
          });
        }
        let newInventory = [...baseState.inventory];
        if (result.playerStateUpdate.addItems) {
          newInventory.push(...result.playerStateUpdate.addItems);
        }
        if (result.playerStateUpdate.removeItems) {
          newInventory = newInventory.filter(item => !result.playerStateUpdate.removeItems?.includes(item.name));
        }
        updatedPlayerState = { attributes: newAttributes, inventory: newInventory };
        setPlayerState(updatedPlayerState);
      }

      const isGameOverNow = result.isGameOver || false;
      const newGameOverMessage = result.gameOverMessage || '冒險結束了。';
      const newChoices = isGameOverNow ? [] : result.choices;

      setIsGameOver(isGameOverNow);
      setGameOverMessage(newGameOverMessage);
      setCurrentChoices(newChoices);

      // Auto-save the new state
      const saveData: SaveData = {
        storyLog: finalStoryLog,
        playerState: updatedPlayerState,
        currentChoices: newChoices,
        isGameOver: isGameOverNow,
        gameOverMessage: newGameOverMessage,
      };
      saveGame(saveData);
      setHasSaveData(true);

    } catch (err) {
      if (err instanceof ApiKeyError) {
        handleChangeKey('您的 API 金鑰無效或已過期，請重新輸入。');
      } else {
        setError(err instanceof Error ? err.message : '發生了意想不到的事件，故事無法繼續。');
        setIsGameOver(true);
        setGameOverMessage('與故事的連結已中斷。');
      }
    } finally {
      setIsLoading(false);
    }
  }, [storyLog, playerState, apiKey, handleChangeKey]);

  const renderGameContent = () => {
    switch (gameState) {
      case GameState.HOME:
        return <HomePage onNewGame={handleNewGame} onContinueGame={handleContinueGame} hasSaveData={hasSaveData} />;
      case GameState.THEME_SELECTION:
        return <ThemeSelector onStart={handleStartGame} isLoading={isLoading} />;
      case GameState.PLAYING:
        return (
          <GameScreen
            storyLog={storyLog}
            choices={currentChoices}
            playerState={playerState}
            isLoading={isLoading}
            isGameOver={isGameOver}
            gameOverMessage={gameOverMessage}
            error={error}
            onMakeChoice={handleMakeChoice}
            onRestart={handleNewGame}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen antialiased">
      <main className="container mx-auto max-w-7xl p-4 md:p-8">
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider" style={{ fontFamily: "'Crimson Text', serif" }}>
            Gemini 冒險紀元
          </h1>
          <p className="text-slate-400 mt-2">一個由 AI 驅動的文字冒險遊戲</p>
          {apiKey && (
            <div className="absolute top-0 right-0 flex items-center space-x-2">
              <button
                onClick={() => setGameState(GameState.HOME)}
                className="bg-slate-700/70 text-slate-300 font-bold py-2 px-4 rounded-lg hover:bg-slate-600/70 transition-all duration-300 text-sm"
                title="返回首頁"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
              <button 
                onClick={() => handleChangeKey()}
                className="bg-slate-700/70 text-slate-300 font-bold py-2 px-4 rounded-lg hover:bg-slate-600/70 transition-all duration-300 text-sm"
              >
                更換 API 金鑰
              </button>
            </div>
          )}
        </header>
        
        {!apiKey ? (
          <ApiKeyInput
            onKeySubmit={handleKeySubmit}
            isVerifying={isVerifyingKey}
            error={keyError}
          />
        ) : renderGameContent()}

      </main>
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        storyLog={storyLog}
      />
    </div>
  );
};

export default App;
