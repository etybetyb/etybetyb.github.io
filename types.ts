export enum GameState {
  HOME,
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
  attributes: CharacterAttributes;
  inventory: InventoryItem[];
}

export interface PlayerStateUpdate {
  addItems?: InventoryItem[];
  removeItems?: string[]; // Array of item names to remove
  setAttributes?: Array<{ key: string; value: string; }>;
}

export interface GeminiResponse {
  sceneDescription: string;
  choices: Choice[];
  isGameOver: boolean;
  gameOverMessage?: string;
  playerStateUpdate?: PlayerStateUpdate;
}

export interface SaveData {
  storyLog: StoryStep[];
  playerState: PlayerState | null;
  currentChoices: Choice[];
  isGameOver: boolean;
  gameOverMessage: string;
}
