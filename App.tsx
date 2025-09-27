

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, StoryStep, Choice, PlayerState, PlayerStateUpdate, SaveData, NpcState, GeminiNpcResponse, CharacterAttributes, MonsterState, GeminiMonsterResponse } from './types';
import { generateAdventureStep, validateApiKey, ApiKeyError, generateCharacterIntroduction, generateInitialAttributes, generateCharacterAvatar, QuotaError, generateThemeInspiration } from './services/geminiService';
import { saveGame, loadGame, clearSave, getAllSaves } from './services/storageService';
import ThemeSelector from './components/ThemeSelector';
import GameScreen from './components/GameScreen';
import HistoryModal from './components/HistoryModal';
import ApiKeyInput from './components/ApiKeyInput';
import HomePage from './components/HomePage';
import CharacterCreation from './components/CharacterCreation';
import LoadingIcon from './components/LoadingIcon';

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

// 輔助函式：將來自 Gemini 回應的 NPC 資料轉換為應用程式狀態格式
const transformNpcsFromResponse = (npcsResponse: GeminiNpcResponse[] | undefined): NpcState[] => {
    if (!npcsResponse) {
        return [];
    }
    return npcsResponse.map(npcData => ({
        name: npcData.name,
        description: npcData.description,
        affinity: npcData.affinity,
        inventory: npcData.inventory,
        unknownItemCount: npcData.unknownItemCount,
        attributes: npcData.attributes.reduce((acc, attr) => {
            const numValue = Number(attr.value);
            acc[attr.key] = isNaN(numValue) ? attr.value : numValue;
            return acc;
        }, {} as CharacterAttributes),
    }));
};

// 輔助函式：將來自 Gemini 回應的怪物資料轉換為應用程式狀態格式
const transformMonstersFromResponse = (monstersResponse: GeminiMonsterResponse[] | undefined): MonsterState[] => {
    if (!monstersResponse) {
        return [];
    }
    return monstersResponse.map(monsterData => ({
        name: monsterData.name,
        description: monsterData.description,
        attributes: monsterData.attributes.reduce((acc, attr) => {
            const numValue = Number(attr.value);
            acc[attr.key] = isNaN(numValue) ? attr.value : numValue;
            return acc;
        }, {} as CharacterAttributes),
    }));
};


const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [storyLog, setStoryLog] = useState<StoryStep[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [npcs, setNpcs] = useState<NpcState[]>([]);
  const [monsters, setMonsters] = useState<MonsterState[]>([]);
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverMessage, setGameOverMessage] = useState<string>('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [saveSlots, setSaveSlots] = useState<(SaveData | null)[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [generatedIntroduction, setGeneratedIntroduction] = useState<string | null>(null);

  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [typewriterSpeed, setTypewriterSpeed] = useState<number>(25); // 中速
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const speedOptions: { [key: string]: number } = {
    '慢': 50,
    '中': 25,
    '快': 10,
    '無': 0,
  };

  const getCurrentSpeedLabel = () => {
    return Object.keys(speedOptions).find(key => speedOptions[key] === typewriterSpeed) || '中';
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
            setIsSpeedMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setNpcs([]);
    setMonsters([]);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setWarnings([]);
    setIsGameOver(false);
    setGameOverMessage('');
    setIsHistoryModalOpen(false);
    setActiveSlot(null);
    setSelectedTheme(null);
    setGeneratedIntroduction(null);
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

  const handleThemeSelected = useCallback(async (theme: string) => {
    if (!apiKey) {
      setError("API 金鑰未設定。");
      return;
    }
    setIsLoading(true);
    setLoadingMessage('正在生成專屬腳色介紹...');
    setError(null);
    setSelectedTheme(theme);
    
    try {
      const introduction = await generateCharacterIntroduction(theme, apiKey);
      setGeneratedIntroduction(introduction);
      setGameState(GameState.CHARACTER_CREATION);
    } catch (error) {
      console.error("Failed to generate introduction:", error);
      if (error instanceof ApiKeyError) {
        handleChangeKey("API 金鑰已失效，請提供新的金鑰。");
      } else {
        setError(error instanceof Error ? error.message : '生成腳色介紹時發生錯誤。');
        setGameState(GameState.THEME_SELECTION); 
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [apiKey, handleChangeKey]);

  const handleGenerateThemeInspiration = useCallback(async (): Promise<string | null> => {
    if (!apiKey) {
      console.warn("Attempted to generate inspiration without an API key.");
      return null;
    }
    try {
      const inspiration = await generateThemeInspiration(apiKey);
      return inspiration;
    } catch (error) {
      console.error("Failed to generate theme inspiration:", error);
      if (error instanceof ApiKeyError) {
        handleChangeKey("API 金鑰已失效，請提供新的金鑰。");
      }
      throw error; // Re-throw so the component can handle UI state
    }
  }, [apiKey, handleChangeKey]);

  const handleGenerateAvatarRequest = useCallback(async (introduction: string): Promise<string | null> => {
    if (!apiKey) {
      setWarnings(prev => [...prev, 'API 金鑰未設定，無法生成頭像。']);
      return null;
    }
    try {
      const generatedAvatar = await generateCharacterAvatar(introduction, apiKey);
      return generatedAvatar;
    } catch (err) {
      if (err instanceof QuotaError) {
        setWarnings(prev => [...prev, err.message]);
      } else {
        console.error("An unexpected error occurred during avatar generation:", err);
        setWarnings(prev => [...prev, '生成角色頭像時發生未知錯誤。']);
      }
      return null;
    }
  }, [apiKey]);

  const handleCharacterConfirm = useCallback(async (name: string, background: string, avatar: string | null) => {
    if (!apiKey || activeSlot === null || !selectedTheme) {
      setError("API 金鑰、存檔欄位或主題未設定。");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('分析角色設定並分配屬性...');
    setError(null);
    setWarnings([]); // 開始新遊戲時清除舊的警告
    clearSave(activeSlot);
    
    setStoryLog([]);
    setNpcs([]);
    setMonsters([]);
    setIsGameOver(false);
    setGameOverMessage('');
    
    try {
      const generatedAttributes = await generateInitialAttributes(background, selectedTheme, apiKey);

      const newPlayerState: PlayerState = {
        name,
        background,
        avatar, // 使用從創建畫面傳來的頭像
        attributes: {
          '生命值': 100,
          '體力值': 100,
          ...generatedAttributes,
        },
        inventory: [],
      };
      setPlayerState(newPlayerState);

      setLoadingMessage('構築世界中...');
      
      const initialHistory: StoryStep[] = [{ type: 'theme', content: selectedTheme }];
      const response = await generateAdventureStep(initialHistory, newPlayerState, [], [], apiKey);

      const newStoryLog: StoryStep[] = [
        ...initialHistory,
        { type: 'scene', content: response.sceneDescription },
      ];
      
      let updatedPlayerState = newPlayerState;
      if (response.playerStateUpdate) {
          updatedPlayerState = applyPlayerStateUpdate(newPlayerState, response.playerStateUpdate);
      }
      
      const transformedNpcs = transformNpcsFromResponse(response.npcs);
      const transformedMonsters = transformMonstersFromResponse(response.monsters);

      setStoryLog(newStoryLog);
      setCurrentChoices(response.choices);
      setPlayerState(updatedPlayerState);
      setNpcs(transformedNpcs);
      setMonsters(transformedMonsters);
      setGameState(GameState.PLAYING);
      
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
        theme: selectedTheme,
        timestamp: Date.now(),
        npcs: transformedNpcs,
        monsters: transformedMonsters,
      }, activeSlot);

    } catch (error) {
      console.error("Failed to start game:", error);
      if (error instanceof ApiKeyError) {
        handleChangeKey("API 金鑰已失效，請提供新的金鑰。");
      } else {
        setError(error instanceof Error ? error.message : '開始新遊戲時發生未知錯誤。');
        setGameState(GameState.CHARACTER_CREATION); // Stay on character creation if something fails
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [apiKey, activeSlot, selectedTheme, handleChangeKey]);


  const handleLoadGame = (slotIndex: number) => {
    const savedData = loadGame(slotIndex);
    if (savedData) {
      const loadedPlayerState = savedData.playerState ? {
        ...savedData.playerState,
        name: savedData.playerState.name || '冒險者',
        background: savedData.playerState.background || '一位身世不明的冒險者。',
        avatar: savedData.playerState.avatar || null, // 向後相容
      } : null;

      setStoryLog(savedData.storyLog);
      setPlayerState(loadedPlayerState);
      setCurrentChoices(savedData.currentChoices);
      setIsGameOver(savedData.isGameOver);
      setGameOverMessage(savedData.gameOverMessage);
      
      const loadedNpcs = (savedData.npcs || []).map(npc => ({
        ...npc,
        description: npc.description || '', // 向後相容
        unknownItemCount: npc.unknownItemCount || 0,
      }));
      setNpcs(loadedNpcs);
      
      const loadedMonsters = (savedData.monsters || []).map(monster => ({
        ...monster,
        description: monster.description || '', // 向後相容
      }));
      setMonsters(loadedMonsters);

      setActiveSlot(slotIndex);
      setGameState(GameState.PLAYING);
    }
  };

  const handleDeleteSave = useCallback((slotIndex: number) => {
    if (window.confirm('你確定要刪除這個冒險紀錄嗎？此操作無法復原。')) {
      clearSave(slotIndex);
      setSaveSlots(prevSlots => {
        const newSlots = [...prevSlots];
        newSlots[slotIndex] = null;
        return newSlots;
      });
    }
  }, []);
  
  const handleUploadSave = (slotIndex: number, saveData: SaveData) => {
    saveGame(saveData, slotIndex);
    setSaveSlots(getAllSaves());
  };

  const handleReturnToHome = () => {
    resetState(true);
  };

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
      const response = await generateAdventureStep(newHistory, playerState, npcs, monsters, apiKey);

      const newStoryLogWithScene: StoryStep[] = [
          ...newHistory,
          { type: 'scene', content: response.sceneDescription }
      ];
      
      let updatedPlayerState = playerState;
      if (response.playerStateUpdate) {
        updatedPlayerState = applyPlayerStateUpdate(playerState, response.playerStateUpdate);
      }
      
      const transformedNpcs = transformNpcsFromResponse(response.npcs);
      const transformedMonsters = transformMonstersFromResponse(response.monsters);

      setStoryLog(newStoryLogWithScene);
      setCurrentChoices(response.choices);
      setPlayerState(updatedPlayerState);
      setNpcs(transformedNpcs);
      setMonsters(transformedMonsters);

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
          timestamp: Date.now(),
          npcs: transformedNpcs,
          monsters: transformedMonsters,
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
  }, [apiKey, activeSlot, playerState, storyLog, currentChoices, npcs, monsters, handleChangeKey]);
  
  const handleClearWarning = (indexToRemove: number) => {
    setWarnings(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const renderContent = () => {
    if (!apiKey) {
      return <ApiKeyInput onKeySubmit={handleKeySubmit} isVerifying={isVerifyingKey} error={keyError} />;
    }

    if (isLoading && (gameState === GameState.THEME_SELECTION || (gameState === GameState.CHARACTER_CREATION && !generatedIntroduction))) {
      return (
        <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm text-center">
          <div className="flex items-center justify-center text-slate-400 my-4 p-4 text-lg">
            <LoadingIcon />
            <span className="ml-3">{loadingMessage || '載入中...'}</span>
          </div>
        </div>
      );
    }
    
    switch (gameState) {
      case GameState.HOME:
        return <HomePage saveSlots={saveSlots} onStartNewGame={handleStartNewGame} onLoadGame={handleLoadGame} onDeleteSave={handleDeleteSave} onUploadSave={handleUploadSave} />;
      case GameState.THEME_SELECTION:
        return <ThemeSelector onThemeSelected={handleThemeSelected} onGenerateInspiration={handleGenerateThemeInspiration} />;
      case GameState.CHARACTER_CREATION:
        return <CharacterCreation 
                    onConfirm={handleCharacterConfirm} 
                    isLoading={isLoading} 
                    loadingMessage={loadingMessage} 
                    theme={selectedTheme} 
                    initialIntroduction={generatedIntroduction} 
                    onGenerateAvatar={handleGenerateAvatarRequest}
                />;
      case GameState.PLAYING:
        return (
          <GameScreen
            storyLog={storyLog}
            choices={currentChoices}
            playerState={playerState}
            npcs={npcs}
            monsters={monsters}
            isLoading={isLoading}
            isGameOver={isGameOver}
            gameOverMessage={gameOverMessage}
            error={error}
            warnings={warnings}
            onMakeChoice={handleMakeChoice}
            onRestart={handleReturnToHome}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onClearWarning={handleClearWarning}
            typewriterSpeed={typewriterSpeed}
          />
        );
      default:
        return <p>未知的遊戲狀態。</p>;
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 text-slate-200 relative min-h-screen">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10 flex items-center gap-4">
        {apiKey && gameState === GameState.PLAYING && (
          <div className="relative" ref={speedMenuRef}>
            <div className="relative group flex items-center">
              <button
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                aria-label="調整文字速度"
                className="bg-slate-700/80 text-slate-300 p-2 rounded-full hover:bg-slate-600/90 transition-all duration-300 shadow-md backdrop-blur-sm border border-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              <span className="absolute right-full mr-3 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                文字速度: {getCurrentSpeedLabel()}
              </span>
            </div>
            {isSpeedMenuOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-slate-800 border border-slate-600 rounded-md shadow-lg py-1 z-20 animate-fade-in-fast">
                {Object.entries(speedOptions).map(([label, speed]) => (
                  <button
                    key={label}
                    onClick={() => {
                      setTypewriterSpeed(speed);
                      setIsSpeedMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span>{label}</span>
                    {typewriterSpeed === speed && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {apiKey && gameState !== GameState.HOME && (
          <div className="relative group flex items-center">
            <button 
              onClick={handleReturnToHome} 
              aria-label="返回主選單"
              className="bg-slate-700/80 text-slate-300 p-2 rounded-full hover:bg-slate-600/90 transition-all duration-300 shadow-md backdrop-blur-sm border border-slate-600"
            >
              {/* FIX: Removed duplicate attributes from SVG element. */}
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
              {/* FIX: Removed duplicate attributes from SVG element. */}
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