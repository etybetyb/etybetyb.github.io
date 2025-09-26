import { GoogleGenAI, Type } from "@google/genai";
import { StoryStep, GeminiResponse, PlayerState } from '../types';

const systemInstruction = `你是一位專為互動式文字冒險遊戲設計的故事大師。你的目標是創造身歷其境、引人入勝且連貫的場景。

**核心職責：**
1.  **生成場景**：根據使用者選擇的主題和後續的選擇，生成新場景的生動描述（約 2-3 個段落）。
2.  **提供選項**：提供 3 到 4 個不同且可操作的選項供玩家選擇。
3.  **管理玩家狀態**：
    *   **初始狀態**：在冒險開始時，為玩家設定一個合理的初始狀態（屬性和可能的初始物品），並在第一次回應的 \`playerStateUpdate\` 欄位中返回。例如：\`"attributes": {"生命值": 100, "理智": 100}\`。
    *   **動態更新**：根據玩家的選擇和故事進展，動態更新玩家的屬性或物品欄。例如，如果玩家撿起一把鑰匙，你必須在 \`playerStateUpdate.addItems\` 中新增它。如果玩家受傷，你必須在 \`playerStateUpdate.setAttributes\` 中更新生命值。
    *   **狀態感知**：你的故事和選項必須反映玩家的當前狀態。如果玩家物品欄裡有繩子，你可以提供一個使用繩子的選項。如果玩家生命值低，場景描述應該反映出他們的虛弱。
4.  **控制遊戲流程**：故事應是動態的，可以導向各種結局。當故事結束時，將 \`isGameOver\` 設為 true 並提供結局訊息。

**回應格式：**
你必須始終以指定的 JSON 格式回應。所有生成的故事、選項和訊息都必須使用**繁體中文**。`;

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
    },
    playerStateUpdate: {
      type: Type.OBJECT,
      description: '一個包含對玩家狀態更新的物件。這是可選的，只有在需要改變玩家屬性或物品時才包含此欄位。',
      properties: {
        addItems: {
          type: Type.ARRAY,
          description: '要添加到玩家物品欄中的物品陣列。',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: '物品名稱。' },
              description: { type: Type.STRING, description: '物品的簡短描述。' }
            },
            required: ['name', 'description']
          }
        },
        removeItems: {
          type: Type.ARRAY,
          description: '要從玩家物品欄中移除的物品名稱陣列。',
          items: { type: Type.STRING }
        },
        setAttributes: {
          type: Type.OBJECT,
          description: '一個物件，其中包含要更新或設定的玩家屬性。例如：`{"生命值": 80, "金幣": 50}`。',
          additionalProperties: {
            oneOf: [{ type: Type.STRING }, { type: Type.NUMBER }]
          }
        }
      }
    }
  },
  required: ['sceneDescription', 'choices', 'isGameOver']
};

function constructPrompt(history: StoryStep[], playerState: PlayerState | null): string {
  const historyText = history.map(step => {
    if (step.type === 'scene') return `場景：${step.content}`;
    if (step.type === 'choice') return `玩家選擇了：「${step.content}」`;
    if (step.type === 'theme') return `開始一個新冒險，主題是：「${step.content}」。`;
    return '';
  }).join('\n\n');

  let stateText = "玩家目前沒有任何狀態。這是冒險的開始。";
  if (playerState) {
    const attributes = Object.entries(playerState.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
    const inventory = playerState.inventory.length > 0 ? playerState.inventory.map(item => item.name).join(', ') : '空的';
    stateText = `玩家當前狀態：\n- 屬性：${attributes}\n- 物品欄：${inventory}`;
  }

  return `根據這段歷史和玩家當前狀態繼續冒險：\n\n**遊戲歷史**\n${historyText}\n\n**${stateText}**\n\n生成下一步。`;
}

export const generateAdventureStep = async (apiKey: string, history: StoryStep[], playerState: PlayerState | null): Promise<GeminiResponse> => {
  if (!apiKey) {
    throw new Error("API 金鑰未提供。");
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = constructPrompt(history, playerState);

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
