
import { SaveData } from '../types';

const SAVE_GAME_KEY_PREFIX = 'gemini-text-adventure-save-';
const MAX_SAVE_SLOTS = 4;

export const saveGame = (saveData: SaveData, slotIndex: number): void => {
  if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
    console.error(`無效的存檔欄位索引: ${slotIndex}`);
    return;
  }
  try {
    const data = JSON.stringify(saveData);
    localStorage.setItem(`${SAVE_GAME_KEY_PREFIX}${slotIndex}`, data);
  } catch (error) {
    console.error("無法儲存遊戲進度:", error);
  }
};

export const loadGame = (slotIndex: number): SaveData | null => {
  if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
    console.error(`無效的存檔欄位索引: ${slotIndex}`);
    return null;
  }
  try {
    const data = localStorage.getItem(`${SAVE_GAME_KEY_PREFIX}${slotIndex}`);
    if (data === null) {
      return null;
    }
    return JSON.parse(data) as SaveData;
  } catch (error) {
    console.error("無法讀取遊戲進度:", error);
    return null;
  }
};

export const clearSave = (slotIndex: number): void => {
  if (slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {
    console.error(`無效的存檔欄位索引: ${slotIndex}`);
    return;
  }
  try {
    localStorage.removeItem(`${SAVE_GAME_KEY_PREFIX}${slotIndex}`);
  } catch (error) {
    console.error("無法清除遊戲存檔:", error);
  }
};

export const getAllSaves = (): (SaveData | null)[] => {
  const saves: (SaveData | null)[] = [];
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    saves.push(loadGame(i));
  }
  return saves;
};
