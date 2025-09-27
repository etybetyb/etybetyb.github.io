
import { GoogleGenAI, Type } from "@google/genai";
import { StoryStep, GeminiResponse, PlayerState, NpcState, MonsterState, CharacterAttributes } from '../types';

// New custom error for API key issues
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

// New custom error for quota issues
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
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

const isQuotaError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message;
    return message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota exceeded');
  }
  return false;
};

// FIX: Corrected system instructions: updated player attributes from 5 to 6, added 'Stamina', and fixed numbered list.
const systemInstruction = `你是一位專為互動式文字冒險遊戲設計的故事大師。你的目標是創造身歷其境、引人入勝且連貫的場景。

**核心職責：**
1.  **生成場景**：根據使用者選擇的主題和後續的選擇，生成新場景的生動描述（約 2-3 個段落）。
2.  **提供選項**：提供 3 到 4 個不同且可操作的選項供玩家選擇。
3.  **管理玩家狀態**：
    *   **角色扮演**：遊戲中的主角是玩家。你應該在場景描述和對話中適時地使用玩家的姓名（如果提供），並將他們的腳色介紹融入敘事中，讓玩家感覺這就是他們自己的故事。
    *   **屬性系統**：玩家有六個核心屬性。你必須根據這些屬性來塑造故事和選項，並在故事進展中更新它們。
        *   **生命值 (Health)**: 範圍 0-100。代表玩家的生命力。降至 0 通常意味著遊戲結束。初始值為 100。
        *   **體力值 (Stamina)**: 範圍 0-100。代表玩家的精力，影響奔跑、攀爬等持續性活動。初始值為 100。
        *   **力量 (Strength)**: 範圍 1-20。代表玩家的物理力量。影響舉重、戰鬥、破壞等。
        *   **敏捷 (Agility)**: 範圍 1-20。代表玩家的靈巧、速度和反應。影響閃避、潛行、精細操作等。
        *   **體質 (Constitution)**: 範圍 1-20。代表玩家的耐力和抵抗力。影響對毒藥、疾病和惡劣環境的抵抗能力。
        *   **精神 (Spirit)**: 範圍 1-20。代表玩家的意志力、專注力和心靈韌性。影響抵抗心靈攻擊、解謎、保持冷靜等。
    *   **屬性等級參考**：1=嬰兒，8=正常成年人，12=頂級運動員，16=超人，20=神。玩家初始時各項非生命值屬性為 8。
    *   **動態更新**：根據玩家的選擇和故事進展，動態更新玩家的屬性或物品欄。例如，如果玩家撿起一把鑰匙，你必須在 \`playerStateUpdate.addItems\` 中新增它。如果玩家受傷，你必須在 \`playerStateUpdate.setAttributes\` 中更新生命值。一次艱苦的攀爬可能會暫時降低體質，或成功後永久增加力量。
    *   **狀態感知**：你的故事和選項必須反映玩家的當前狀態。如果玩家物品欄裡有繩子，你可以提供一個使用繩子的選項。如果玩家力量高，可以提供一個蠻力選項。如果玩家生命值低，場景描述應該反映出他們的虛弱。
4.  **管理 NPC 狀態**：
    *   識別場景中的重要 NPC（非玩家角色）。
    *   如果場景中有 NPC，你**必須**在 \`npcs\` 陣列中回傳他們的完整狀態。
    *   每個 NPC 的狀態**必須**包含：名稱、對玩家的 \`affinity\` (好感度)、一段關於其外觀或性格的簡短描述、以及他們的物品。
    *   **屬性**：你**必須**為每個 NPC 提供完整的核心屬性集。此欄位不應為空。
        *   **核心屬性**：每個 NPC **必須**包含 '生命值', '體力值', '力量', '敏捷', '體質', '精神' 這六個屬性。其數值範圍與玩家相同（力量/敏捷/體質/精神為 1-20，生命值/體力值為 0-100）。
        *   **其他屬性**：你也可以根據 NPC 的特性和情境添加其他描述性屬性，例如 '狀態: 正常', '情緒: 警惕' 等。
    *   **物品欄可見性**：NPC 的物品欄應只包含玩家已知或觀察到的物品。使用 \`unknownItemCount\` 欄位來表示 NPC 攜帶的、但玩家尚不知道的隱藏物品數量。例如，如果一個警衛帶著一把劍和一個隱藏的錢包，你應該回傳 \`inventory: [{name: '警衛的劍', ...}]\` 和 \`unknownItemCount: 1\`。
    *   NPC 的狀態（尤其是好感度）應該會根據玩家的行動而改變。
5.  **管理怪物狀態**：
    *   識別場景中的敵對生物或怪物。
    *   如果場景中有怪物，你**必須**在 \`monsters\` 陣列中回傳牠們的狀態。
    *   每個怪物的狀態**必須**包含：名稱、對其外觀和行為的簡短描述、以及牠的屬性（例如 '生命值', '力量', '敏捷'）。
    *   怪物通常是敵對的，不需要好感度或複雜的物品欄。
6.  **控制遊戲流程**：故事應是動態的，可以導向各種结局。當故事結束時（例如生命值降為 0），將 \`isGameOver\` 設為 true 並提供结局訊息。

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
    },
    npcs: {
      type: Type.ARRAY,
      description: '場景中出現的 NPC 狀態陣列。如果沒有 NPC，則為空陣列。',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'NPC 的名稱。' },
          description: { type: Type.STRING, description: '對 NPC 外觀、性格或背景的簡短描述。' },
          affinity: { type: Type.STRING, description: "NPC 對玩家的好感度 (例如 '友好', '中立', '敵對')。" },
          attributes: {
            type: Type.ARRAY,
            description: "一個包含 NPC 屬性的鍵值對陣列。例如：`[{\"key\": \"狀態\", \"value\": \"警戒中\"}]`",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: '屬性名稱。' },
                    value: { type: Type.STRING, description: '屬性值（以字串形式）。' }
                },
                required: ['key', 'value']
            }
          },
          inventory: {
            type: Type.ARRAY,
            description: 'NPC 攜帶的、玩家已知的物品陣列。',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: '物品名稱。' },
                description: { type: Type.STRING, description: '物品的簡短描述。' }
              },
              required: ['name', 'description']
            }
          },
          unknownItemCount: {
            type: Type.NUMBER,
            description: 'NPC 攜帶的、但玩家未觀察到或未知的隱藏物品數量。'
          },
        },
        required: ['name', 'description', 'affinity', 'attributes', 'inventory', 'unknownItemCount']
      }
    },
    monsters: {
        type: Type.ARRAY,
        description: '場景中出現的怪物狀態陣列。如果沒有怪物，則為空陣列。',
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: '怪物的名稱。' },
                description: { type: Type.STRING, description: '對怪物外觀和行為的簡短描述。' },
                attributes: {
                    type: Type.ARRAY,
                    description: "一個包含怪物屬性的鍵值對陣列。例如：`[{\"key\": \"生命值\", \"value\": \"30\"}]`",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING, description: '屬性名稱。' },
                            value: { type: Type.STRING, description: '屬性值（以字串形式）。' }
                        },
                        required: ['key', 'value']
                    }
                }
            },
            required: ['name', 'attributes', 'description']
        }
    }
  },
  required: ['sceneDescription', 'choices', 'isGameOver']
};

// FIX: Updated prompt constructor to include NPC state, giving the model full context.
function constructPrompt(history: StoryStep[], playerState: PlayerState | null, npcs: NpcState[], monsters: MonsterState[]): string {
  const historyText = history.map(step => {
    if (step.type === 'scene') return `場景：${step.content}`;
    if (step.type === 'choice') return `玩家選擇了：「${step.content}」`;
    if (step.type === 'theme') return `開始一個新冒險，主題是：「${step.content}」。`;
    return '';
  }).join('\n\n');

  let playerStateText = "玩家目前沒有任何狀態。這是冒險的開始。";
  if (playerState) {
    const name = playerState.name || '無名者';
    const background = playerState.background || '沒有特別的介紹。';
    const attributes = Object.entries(playerState.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
    const inventory = playerState.inventory.length > 0 ? playerState.inventory.map(item => item.name).join(', ') : '空的';
    playerStateText = `玩家資訊：\n- 姓名: ${name}\n- 介紹: ${background}\n\n玩家當前狀態：\n- 屬性：${attributes}\n- 物品欄：${inventory}`;
  }
  
  let npcStateText = "目前場景中沒有其他重要角色。";
  if (npcs && npcs.length > 0) {
    npcStateText = "場景中其他角色的狀態：\n" + npcs.map(npc => {
      const attributes = Object.entries(npc.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
      const knownItems = npc.inventory.length > 0 ? npc.inventory.map(item => item.name).join(', ') : '無';
      let inventoryText = `已知物品: ${knownItems}`;
      if (npc.unknownItemCount > 0) {
          inventoryText += ` | 未知物品數量: ${npc.unknownItemCount}`;
      }
      return `- ${npc.name} (好感度: ${npc.affinity}):\n  - 屬性: ${attributes}\n  - 物品欄: ${inventoryText}`;
    }).join('\n');
  }

  let monsterStateText = "目前場景中沒有敵對生物。";
  if (monsters && monsters.length > 0) {
    monsterStateText = "場景中敵對生物的狀態：\n" + monsters.map(monster => {
      const attributes = Object.entries(monster.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
      return `- ${monster.name}:\n  - 屬性: ${attributes}`;
    }).join('\n');
  }

  const userPrompt = `根據這段歷史和角色狀態繼續冒險：\n\n**遊戲歷史**\n${historyText}\n\n**${playerStateText}**\n\n**${npcStateText}**\n\n**${monsterStateText}**\n\n生成下一步。`;
  
  return userPrompt;
}

export const generateThemeInspiration = async (apiKey: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `你是一位充滿創意的故事大師，專門為文字冒險遊戲發想獨特且引人入勝的主題。你的任務是生成一個單句、富有想像力的場景或概念作為遊戲的起點。請直接回傳主題文字，不要包含任何額外的解釋、引號或標籤。`;
    const prompt = `生成一個冒險主題靈感。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
        topP: 0.95,
      },
    });

    const themeText = response.text.trim();
    if (!themeText) {
      return null;
    }
    // 清理模型可能添加的引號
    return themeText.replace(/^"|"$/g, '');

  } catch (error) {
    console.error("generateThemeInspiration 失敗:", error);
    if (isApiKeyError(error)) {
        throw new ApiKeyError("API 金鑰無效或已過期。");
    }
    // 對於其他錯誤，向上拋出，讓呼叫者可以處理 UI 狀態
    throw error;
  }
};

export const generateCharacterIntroduction = async (
  theme: string,
  apiKey: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `你是一位遊戲角色設定大師。你的任務是為玩家生成一段結構化、富有代入感的「腳色介紹」。
这个介紹應該像一份角色設定集，為玩家提供一個清晰且富有代入感的起點。請嚴格遵循以下結構和風格來生成內容，確保包含所有要點：

1.  **身份與年齡**: 描述角色的職業和大致年齡。
2.  **外觀與體格**: 描述髮色、眼睛顏色、身材等特徵。
3.  **出身與家庭**: 簡述出生地和家庭背景。
4.  **動機與渴望**: 解釋角色為何踏上冒險。
5.  **技能與弱點**: 點出角色擅長的能力和不擅長的事情。

**範例格式與風格參考（請根據使用者提供的主題生成原創內容）：**
「我是一名年僅 19 歲的見習冒險者。
有著一頭凌亂的棕色短髮與銳利的灰藍色眼睛，身材偏瘦卻敏捷。
出生於邊境小村，父親是獵人，母親則經營著一家小酒館。
雖然出身平凡，但始終渴望離開村莊，去外面的世界探索未知。
擅長弓術與追蹤，卻對近身戰鬥毫無把握。」

你的回應必須直接是生成的腳色介紹文字，不要包含任何標題、數字編號或額外的解釋。`;
    const prompt = `為一位即將在「${theme}」主題世界中展開冒險的玩家生成角色介紹。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    const introductionText = response.text.trim();
    if (!introductionText) {
      throw new Error("AI 未能生成腳色介紹。");
    }
    return introductionText;
  } catch (error) {
    console.error("generateCharacterIntroduction 失敗:", error);
    if (isApiKeyError(error)) {
        throw new ApiKeyError("API 金鑰無效或已過期。");
    }
    // Fallback background
    return `一位來自未知之地，命運與「${theme}」緊密相連的神秘冒險者。`;
  }
};

export const generateCharacterAvatar = async (
  introduction: string,
  apiKey: string
): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `根據以下角色描述，生成一張 160x160 動漫風格的半身像。只要角色本身，背景為單純的純色背景。\n\n描述：「${introduction}」`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("generateCharacterAvatar 失敗:", error);
        if (isQuotaError(error)) {
            throw new QuotaError('角色頭像生成失敗，因為已達到每日用量上限。');
        }
        return null;
    }
};

const attributesSchema = {
    type: Type.OBJECT,
    properties: {
        '力量': { type: Type.INTEGER, description: '角色的力量值' },
        '敏捷': { type: Type.INTEGER, description: '角色的敏捷值' },
        '體質': { type: Type.INTEGER, description: '角色的體質值' },
        '精神': { type: Type.INTEGER, description: '角色的精神值' },
    },
    required: ['力量', '敏捷', '體質', '精神'],
};

export const generateInitialAttributes = async (
  introduction: string,
  theme: string,
  apiKey: string,
): Promise<Pick<CharacterAttributes, '力量' | '敏捷' | '體質' | '精神'>> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `你是一位遊戲大師，負責根據玩家的角色設定來分配初始屬性點數。

**分配規則：**
1.  **屬性**：你將分配「力量」、「敏捷」、「體質」和「精神」四項屬性。
2.  **數值範圍**：每項屬性的值必須介於 5 到 13 之間（包含 5 和 13）。
3.  **總和限制**：四項屬性的總和必須介於 32 到 44 之間（包含 32 和 44）。
4.  **邏輯性**：屬性分配應反映角色介紹中的描述。例如，身材瘦弱但敏捷的角色，其「敏捷」應較高，「力量」或「體質」可能較低；意志堅定的角色，「精神」應較高。
5.  **格式**：你必須以指定的 JSON 格式回傳結果。`;
        
        const prompt = `請仔細閱讀以下在「${theme}」世界中的角色介紹，並為其分配屬性。

**角色介紹：**
「${introduction}」`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: attributesSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("AI 未能生成屬性。");
        }
        const parsedAttributes = JSON.parse(jsonText);

        const { '力量': str, '敏捷': agi, '體質': con, '精神': spr } = parsedAttributes;
        const total = str + agi + con + spr;
        if ([str, agi, con, spr].some(val => val < 5 || val > 13) || total < 32 || total > 44) {
             console.warn("AI 生成的屬性超出規則範圍，將使用預設值。", parsedAttributes);
             return { '力量': 8, '敏捷': 8, '體質': 8, '精神': 8 };
        }

        return parsedAttributes;

    } catch (error) {
        console.error("generateInitialAttributes 失敗:", error);
        if (isApiKeyError(error)) {
            throw new ApiKeyError("API 金鑰無效或已過期。");
        }
        console.warn("因發生錯誤，將使用預設屬性。");
        return { '力量': 8, '敏捷': 8, '體質': 8, '精神': 8 };
    }
};


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

// FIX: Updated function signature to accept NPC state.
export const generateAdventureStep = async (history: StoryStep[], playerState: PlayerState | null, npcs: NpcState[], monsters: MonsterState[], apiKey: string): Promise<GeminiResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = constructPrompt(history, playerState, npcs, monsters);
  
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