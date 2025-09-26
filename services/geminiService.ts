
import { GoogleGenAI, Type } from "@google/genai";
import { StoryStep, GeminiResponse } from '../types';

const systemInstruction = `你是一位專為互動式文字冒險遊戲設計的故事大師。你的目標是創造身歷其境、引人入勝且連貫的場景。根據使用者選擇的主題和後續的選擇，你將生成新場景的描述，並提供 3 到 4 個不同且可操作的選項供玩家選擇。你必須始終以指定的 JSON 格式回應。故事應是動態的，可以導向各種結局，包括一個結論或遊戲結束狀態。請保持語氣與初始主題一致。場景描述應生動細膩，長度約為 2-3 個段落。所有生成的故事和選項都必須使用繁體中文。`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    sceneDescription: {
      type: Type.STRING,
      description: '對當前場景及玩家上一個選擇結果的詳細、引人入勝的描述。這應該有 2-3 個段落長。必須使用繁體中文。'
    },
    choices: {
      type: Type.ARRAY,
      description: '一個包含 3 到 4 個不同選項的陣列供玩家選擇。如果遊戲結束，此陣列應為空。所有選項都必須使用繁體中文。',
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: '呈現給玩家的選項文字。'
          }
        },
        required: ['text']
      }
    },
    isGameOver: {
      type: Type.BOOLEAN,
      description: '一個布林值，表示遊戲是否已達到結局或遊戲結束狀態。'
    },
    gameOverMessage: {
      type: Type.STRING,
      description: '如果 isGameOver 為 true，則顯示一條結束訊息。這可以是勝利或失敗的訊息。必須使用繁體中文。'
    }
  },
  required: ['sceneDescription', 'choices', 'isGameOver']
};

function constructPrompt(history: StoryStep[]): string {
  if (history.length === 1 && history[0].type === 'theme') {
    return `開始一個新冒險，主題是：「${history[0].content}」。`;
  }
  
  const historyText = history.map(step => {
    if (step.type === 'scene') return `場景：${step.content}`;
    if (step.type === 'choice') return `玩家選擇了：「${step.content}」`;
    return `主題：${step.content}`;
  }).join('\n\n');

  return `根據這段歷史繼續冒險：\n\n${historyText}\n\n生成下一步。`;
}

export const generateAdventureStep = async (apiKey: string, history: StoryStep[]): Promise<GeminiResponse> => {
  if (!apiKey) {
    throw new Error("API 金鑰未提供。");
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = constructPrompt(history);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.8,
      topP: 0.95,
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);
    return parsedResponse as GeminiResponse;
  } catch (error) {
    console.error("解析 Gemini 回應失敗:", response.text);
    throw new Error("來自說書人的回應格式無效。");
  }
};
