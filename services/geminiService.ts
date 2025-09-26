
import { GoogleGenAI, Type } from "@google/genai";
import { StoryStep, GeminiResponse, PlayerState } from '../types';

// New custom error for API key issues
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

// Helper to identify API key-related errors from the SDK
const isApiKeyError = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Error messages from Google AI SDK can be complex.
    // We look for common indicators of auth failure.
    // Example: "[GoogleGenerativeAI Error]: [400 Bad Request] API key not valid. Please pass a valid API key."
    const message = error.message;
    return message.includes('API key not valid') || 
           message.includes('permission denied') || 
           message.includes('400 Bad Request');
  }
  return false;
};

const systemInstruction = `你是一位專為互動式文字冒險遊戲設計的故事大師。你的目標是創造身歷其境、引人入勝且連貫的場景。

**核心職責：**
1.  **生成場景**：根據使用者選擇的主題和後續的選擇，生成新場景的生動描述（約 2-3 個段落）。
2.  **提供選項**：提供 3 到 4 個不同且可操作的選項供玩家選擇。
3.  **管理玩家狀態**：
    *   **屬性系統**：玩家有五個核心屬性。你必須根據這些屬性來塑造故事和選項，並在故事進展中更新它們。
        *   **生命值 (Health)**: 範圍 0-100。代表玩家的生命力。降至 0 通常意味著遊戲結束。初始值為 100。
        *   **力量 (Strength)**: 範圍 1-20。代表玩家的物理力量。影響舉重、戰鬥、破壞等。
        *   **敏捷 (Agility)**: 範圍 1-20。代表玩家的靈巧、速度和反應。影響閃避、潛行、精細操作等。
        *   **體質 (Constitution)**: 範圍 1-20。代表玩家的耐力和抵抗力。影響對毒藥、疾病和惡劣環境的抵抗能力。
        *   **精神 (Spirit)**: 範圍 1-20。代表玩家的意志力、專注力和心靈韌性。影響抵抗心靈攻擊、解謎、保持冷靜等。
    *   **屬性等級參考**：1=嬰兒，8=正常成年人，12=頂級運動員，16=超人，20=神。玩家初始時各項非生命值屬性為 8。
    *   **動態更新**：根據玩家的選擇和故事進展，動態更新玩家的屬性或物品欄。例如，如果玩家撿起一把鑰匙，你必須在 \`playerStateUpdate.addItems\` 中新增它。如果玩家受傷，你必須在 \`playerStateUpdate.setAttributes\` 中更新生命值。一次艱苦的攀爬可能會暫時降低體質，或成功後永久增加力量。
    *   **狀態感知**：你的故事和選項必須反映玩家的當前狀態。如果玩家物品欄裡有繩子，你可以提供一個使用繩子的選項。如果玩家力量高，可以提供一個蠻力選項。如果玩家生命值低，場景描述應該反映出他們的虛弱。
4.  **控制遊戲流程**：故事應是動態的，可以導向各種结局。當故事結束時（例如生命值降為 0），將 \`isGameOver\` 設為 true 並提供结局訊息。

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
          type: Type.ARRAY,
          description: '要更新或設定的玩家屬性陣列。例如：`[{"key": "生命值", "value": "80"}, {"key": "狀態", "value": "良好"}]`。',
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING, description: '屬性名稱。' },
              value: { type: Type.STRING, description: '屬性值（以字串形式）。' }
            },
            required: ['key', 'value']
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

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  // This is a robust way to validate a key.
  // We make a simple GET request to a specific model endpoint.
  // A successful response (200 OK) indicates a valid key.
  // An invalid key will result in a 4xx error.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${apiKey}`;
  
  try {
    // A simple GET request does not need any special headers like 'Content-Type'.
    const response = await fetch(url);

    if (response.ok) {
      // A 200 OK response means the key is valid and has access to the model.
      return true;
    } else {
      // If the key is invalid or the request is bad, the API returns a non-ok status.
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`API Key validation failed with status ${response.status}:`, errorData);
      return false;
    }
  } catch (error) {
    // This catches network errors (e.g., CORS, DNS issues, no internet).
    console.error("API Key validation request failed due to a network or fetch error:", error);
    return false;
  }
};

export const generateAdventureStep = async (history: StoryStep[], playerState: PlayerState | null, apiKey: string): Promise<GeminiResponse> => {
  try {
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

    const jsonText = response.text.trim();
    if (!jsonText) {
      console.error("Gemini 回應為空:", response);
      throw new Error("說書人沒有回應。可能是內容被過濾。");
    }
    const parsedResponse = JSON.parse(jsonText);
    return parsedResponse as GeminiResponse;
  } catch (error) {
    console.error("generateAdventureStep 失敗:", error);
    
    if (isApiKeyError(error)) {
        throw new ApiKeyError("API 金鑰無效或已過期。");
    }
    
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`與說書人的通訊出現問題: ${message}`);
  }
};
