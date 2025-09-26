import { SaveData } from '../types';

const SAVE_GAME_KEY = 'gemini-text-adventure-save';

export const saveGame = (saveData: SaveData): void => {
  try {
    const data = JSON.stringify(saveData);
    localStorage.setItem(SAVE_GAME_KEY, data);
  } catch (error) {
    console.error("無法儲存遊戲進度:", error);
  }
};

export const loadGame = (): SaveData | null => {
  try {
    const data = localStorage.getItem(SAVE_GAME_KEY);
    if (data === null) {
      return null;
    }
    return JSON.parse(data) as SaveData;
  } catch (error) {
    console.error("無法讀取遊戲進度:", error);
    return null;
  }
};

export const clearSave = (): void => {
  try {
    localStorage.removeItem(SAVE_GAME_KEY);
  } catch (error) {
    console.error("無法清除遊戲存檔:", error);
  }
};
