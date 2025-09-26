
export enum GameState {
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

export interface GeminiResponse {
  sceneDescription: string;
  choices: Choice[];
  isGameOver: boolean;
  gameOverMessage?: string;
}
