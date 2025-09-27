

export enum GameState {
  HOME,
  CHARACTER_CREATION,
  THEME_SELECTION,
  PLAYING,
}

export interface StoryStep {
  type: 'theme' | 'scene' | 'choice';
  content: string;
}

export interface Choice {
  text: string;
}

export interface InventoryItem {
  name: string;
  description: string;
}

export interface CharacterAttributes {
  [key: string]: string | number;
}

export interface PlayerState {
  name: string;
  background: string;
  avatar: string | null;
  attributes: CharacterAttributes;
  inventory: InventoryItem[];
}

export interface NpcState {
  name: string;
  description: string;
  attributes: CharacterAttributes;
  inventory: InventoryItem[]; // 已知物品
  unknownItemCount: number; // 未知物品的數量
  affinity: string; // e.g., '友好', '中立', '敵對'
}

export interface MonsterState {
  name: string;
  attributes: CharacterAttributes;
  description: string;
}

export interface PlayerStateUpdate {
  addItems?: InventoryItem[];
  removeItems?: string[]; // Array of item names to remove
  setAttributes?: Array<{ key: string; value: string; }>;
}

// 用於表示來自 Gemini 的原始 NPC 屬性回應的類型
export interface GeminiNpcAttribute {
  key: string;
  value: string;
}

// 用於表示來自 Gemini 的原始 NPC 回應的類型
export interface GeminiNpcResponse {
  name: string;
  description: string;
  attributes: GeminiNpcAttribute[];
  inventory: InventoryItem[]; // 玩家已知或觀察到的物品
  unknownItemCount: number; // 玩家未知的隱藏物品數量
  affinity: string;
}

// 用於表示來自 Gemini 的原始怪物回應的類型
export interface GeminiMonsterResponse {
  name: string;
  attributes: GeminiNpcAttribute[];
  description: string;
}


// 更新 GeminiResponse 以使用新的 NPC 類型
export interface GeminiResponse {
  sceneDescription: string;
  choices: Choice[];
  isGameOver: boolean;
  gameOverMessage?: string;
  playerStateUpdate?: PlayerStateUpdate;
  npcs?: GeminiNpcResponse[];
  monsters?: GeminiMonsterResponse[];
}

export interface SaveData {
  storyLog: StoryStep[];
  playerState: PlayerState | null;
  currentChoices: Choice[];
  isGameOver: boolean;
  gameOverMessage: string;
  theme: string;
  timestamp: number;
  npcs: NpcState[];
  monsters: MonsterState[];
}