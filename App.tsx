
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, StoryStep, Choice, PlayerState, PlayerStateUpdate, SaveData } from './types';
import { generateAdventureStep, validateApiKey, ApiKeyError } from './services/geminiService';
import { saveGame, loadGame, clearSave, getAllSaves } from './services/storageService';
import ThemeSelector from './components/ThemeSelector';
import GameScreen from './components/GameScreen';
import HistoryModal from './components/HistoryModal';
import ApiKeyInput from './components/ApiKeyInput';
import HomePage from './components/HomePage';

// 輔助函式，用於將更新應用於玩家狀態
const applyPlayerStateUpdate = (currentState: PlayerState, update: PlayerStateUpdate): PlayerState => {
  const newState = { 
    ...currentState, 
    attributes: { ...currentState.attributes }, 
    inventory: [...currentState.inventory] 
  };

  // 更新屬性
  if (update.setAttributes) {
    update.setAttributes.forEach(attr => {
      // AI 以字串形式回傳值，如果可能，則嘗試轉換為數字
      const numValue = Number(attr.value);
      newState.attributes[attr.key] = isNaN(numValue) ? attr.value : numValue;
    });
  }

  // 新增物品
  if (update.addItems) {
    newState.inventory.push(...update.addItems);
  }

  // 移除物品
  if (update.removeItems) {
    const itemsToRemove = new Set(update.removeItems);
    newState.inventory = newState.inventory.filter(item => !itemsToRemove.has(item.name));
  }

  return newState;
};


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
  
  const [saveSlots, setSaveSlots] = useState<(SaveData | null)[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
        setApiKey(storedKey);
    }
    setSaveSlots(getAllSaves());
  }, []);

  const resetState = useCallback((isFullReset: boolean = false) => {
    if (isFullReset) {
      setGameState(GameState.HOME);
      setSaveSlots(getAllSaves());
    }
    setStoryLog([]);
    setCurrentChoices([]);
    setPlayerState(null);
    setIsLoading(false);
    setError(null);
    setIsGameOver(false);
    setGameOverMessage('');
    setIsHistoryModalOpen(false);
    setActiveSlot(null);
  }, []);

  const handleKeySubmit = useCallback(async (key: string) => {
    setIsVerifyingKey(true);
    setKeyError(null);
    const isValid = await validateApiKey(key);
    setIsVerifyingKey(false);

    if (isValid) {
      localStorage.setItem('gemini-api-key', key);
      setApiKey(key);
      resetState(true);
    } else {
      setKeyError('API 金鑰無效或無法驗證。請檢查金鑰並重試。');
    }
  }, [resetState]);
  
  const handleChangeKey = useCallback((errorMessage?: string) => {
    localStorage.removeItem('gemini-api-key');
    setApiKey(null);
    resetState(true);
    if (errorMessage) {
      setKeyError(errorMessage);
    }
  }, [resetState]);

  const handleStartNewGame = (slotIndex: number) => {
    resetState();
    setActiveSlot(slotIndex);
    setGameState(GameState.THEME_SELECTION);
  };

  const handleLoadGame = (slotIndex: number) => {
    const savedData = loadGame(slotIndex);
    if (savedData) {
      setStoryLog(savedData.storyLog);
      setPlayerState(savedData.playerState);
      setCurrentChoices(savedData.currentChoices);
      setIsGameOver(savedData.isGameOver);
      setGameOverMessage(savedData.gameOverMessage);
      setActiveSlot(slotIndex);
      setGameState(GameState.PLAYING);
    }
  };

  const handleDeleteSave = (slotIndex: number) => {
    if (window.confirm('你確定要刪除這個冒險紀錄嗎？此操作無法復原。')) {
      clearSave(slotIndex);
      setSaveSlots(getAllSaves());
    }
  };
  
  const handleUploadSave = (slotIndex: number, saveData: SaveData) => {
    saveGame(saveData, slotIndex);
    setSaveSlots(getAllSaves());
  };

  const handleReturnToHome = () => {
    resetState();
    setGameState(GameState.HOME);
    setSaveSlots(getAllSaves());
  };

  const handleStartGame = useCallback(async (theme: string) => {
    if (!apiKey || activeSlot === null) {
      setError("API 金鑰未設定或未選擇存檔欄位。");
      return;
    }
    setIsLoading(true);
    setError(null);
    clearSave(activeSlot);
    
    const initialPlayerState: PlayerState = {
      attributes: {
        '生命值': 100,
        '體力值': 100,
        '力量': 8,
        '敏捷': 8,
        '體質': 8,
        '精神': 8,
      },
      inventory: [],
    };
    
    setPlayerState(initialPlayerState);
    setStoryLog([]);
    setIsGameOver(false);
    setGameOverMessage('');
    
    setGameState(GameState.PLAYING);

    try {
      const initialHistory: StoryStep[] = [{ type: 'theme', content: theme }];
      const response = await generateAdventureStep(initialHistory, initialPlayerState, apiKey);

      const newStoryLog: StoryStep[] = [
        ...initialHistory,
        { type: 'scene', content: response.sceneDescription },
      ];
      
      let updatedPlayerState = initialPlayerState;
      if (response.playerStateUpdate) {
          updatedPlayerState = applyPlayerStateUpdate(initialPlayerState, response.playerStateUpdate);
      }

      setStoryLog(newStoryLog);
      setCurrentChoices(response.choices);
      setPlayerState(updatedPlayerState);
      
      if (response.isGameOver) {
        setIsGameOver(true);
        setGameOverMessage(response.gameOverMessage || '遊戲結束。');
      }

      saveGame({
        storyLog: newStoryLog,
        playerState: updatedPlayerState,
        currentChoices: response.choices,
        isGameOver: response.isGameOver,
        gameOverMessage: response.gameOverMessage || '',
        theme: theme,
        timestamp: Date.now()
      }, activeSlot);

    } catch (error) {
      console.error("Failed to start game:", error);
      if (error instanceof ApiKeyError) {
        handleChangeKey("API 金鑰已失效，請提供新的金鑰。");
      } else {
        setError(error instanceof Error ? error.message : '開始新遊戲時發生未知錯誤。');
        setGameState(GameState.THEME_SELECTION);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, activeSlot, handleChangeKey]);

  const handleMakeChoice = useCallback(async (choiceText: string) => {
    if (!apiKey || activeSlot === null || !playerState) {
      setError("遊戲狀態無效，無法繼續。");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const newHistory: StoryStep[] = [
      ...storyLog,
      { type: 'choice', content: choiceText },
    ];
    
    setStoryLog(newHistory);
    setCurrentChoices([]);

    try {
      const response = await generateAdventureStep(newHistory, playerState, apiKey);

      const newStoryLogWithScene: StoryStep[] = [
          ...newHistory,
          { type: 'scene', content: response.sceneDescription }
      ];
      
      let updatedPlayerState = playerState;
      if (response.playerStateUpdate) {
        updatedPlayerState = applyPlayerStateUpdate(playerState, response.playerStateUpdate);
      }

      setStoryLog(newStoryLogWithScene);
      setCurrentChoices(response.choices);
      setPlayerState(updatedPlayerState);

      if (response.isGameOver) {
        setIsGameOver(true);
        setGameOverMessage(response.gameOverMessage || '遊戲結束。');
      }

      const theme = storyLog.find(s => s.type === 'theme')?.content;
      if (theme) {
        saveGame({
          storyLog: newStoryLogWithScene,
          playerState: updatedPlayerState,
          currentChoices: response.choices,
          isGameOver: response.isGameOver,
          gameOverMessage: response.gameOverMessage || '',
          theme: theme,
          timestamp: Date.now()
        }, activeSlot);
      }

    } catch (error) {
      console.error("Failed to process choice:", error);
      if (error instanceof ApiKeyError) {
        handleChangeKey("API 金鑰已失效，請提供新的金鑰。");
      } else {
        setError(error instanceof Error ? error.message : '處理您的選擇時發生未知錯誤。');
        setStoryLog(storyLog);
        setCurrentChoices(currentChoices);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, activeSlot, playerState, storyLog, currentChoices, handleChangeKey]);
  
  const renderContent = () => {
    if (!apiKey) {
      return <ApiKeyInput onKeySubmit={handleKeySubmit} isVerifying={isVerifyingKey} error={keyError} />;
    }
    
    switch (gameState) {
      case GameState.HOME:
        return <HomePage saveSlots={saveSlots} onStartNewGame={handleStartNewGame} onLoadGame={handleLoadGame} onDeleteSave={handleDeleteSave} onUploadSave={handleUploadSave} />;
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
            onRestart={handleReturnToHome}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
          />
        );
      default:
        return <p>未知的遊戲狀態。</p>;
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 text-slate-200 relative min-h-screen">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10 flex items-center gap-4">
        {apiKey && gameState !== GameState.HOME && (
          <div className="relative group flex items-center">
            <button 
              onClick={handleReturnToHome} 
              aria-label="返回主選單"
              className="bg-slate-700/80 text-slate-300 p-2 rounded-full hover:bg-slate-600/90 transition-all duration-300 shadow-md backdrop-blur-sm border border-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <span className="absolute right-full mr-3 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              返回主選單
            </span>
          </div>
        )}
        {apiKey && (
          <div className="relative group flex items-center">
            <button 
              onClick={() => handleChangeKey()}
              aria-label="更換 API 金鑰"
              className="bg-slate-700/80 text-slate-300 p-2 rounded-full hover:bg-slate-600/90 transition-all duration-300 shadow-md backdrop-blur-sm border border-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 7z" />
              </svg>
            </button>
             <span className="absolute right-full mr-3 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              更換 API 金鑰
            </span>
          </div>
        )}
      </div>

      <header className="text-center mb-8 pt-16 md:pt-0">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
          Gemini 冒險紀元
        </h1>
      </header>

      {renderContent()}
      
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} storyLog={storyLog} />

    </main>
  );
};

export default App;
