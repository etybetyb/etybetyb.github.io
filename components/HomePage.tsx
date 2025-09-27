
import React, { useRef, useState } from 'react';
import { SaveData } from '../types';

interface HomePageProps {
  saveSlots: (SaveData | null)[];
  onStartNewGame: (slotIndex: number) => void;
  onLoadGame: (slotIndex: number) => void;
  onDeleteSave: (slotIndex: number) => void;
  onUploadSave: (slotIndex: number, saveData: SaveData) => void;
}

const HomePage: React.FC<HomePageProps> = ({ saveSlots, onStartNewGame, onLoadGame, onDeleteSave, onUploadSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSlotIndex, setUploadSlotIndex] = useState<number | null>(null);

  const handleDownload = (slotIndex: number) => {
    const saveData = saveSlots[slotIndex];
    if (!saveData) return;

    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-adventure-save-slot-${slotIndex + 1}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = (slotIndex: number) => {
    setUploadSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadSlotIndex === null) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('無法讀取檔案內容。');
        }
        const parsedData = JSON.parse(text);

        // 基本驗證
        if (parsedData.storyLog && parsedData.playerState && parsedData.theme && parsedData.timestamp) {
          onUploadSave(uploadSlotIndex, parsedData as SaveData);
        } else {
          alert('無效的存檔檔案格式。');
        }
      } catch (error) {
        console.error('解析存檔檔案時出錯:', error);
        alert('讀取存檔檔案失敗。請確認檔案為有效的 JSON 格式。');
      } finally {
        // 重設檔案輸入值，以允許再次上傳相同檔案
        if (event.target) {
          event.target.value = '';
        }
        setUploadSlotIndex(null);
      }
    };
    reader.onerror = () => {
      alert('讀取檔案時發生錯誤。');
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />
      <h2 className="text-3xl font-bold text-cyan-300 mb-2 text-center">冒險日誌</h2>
      <p className="text-slate-400 mb-8 text-center">選擇你的旅程，或開啟一段新的傳說。</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {saveSlots.map((save, index) => (
          <div key={index} className="bg-slate-900/70 p-6 rounded-lg border border-slate-700 flex flex-col justify-between transition-shadow hover:shadow-cyan-500/20">
            <div className="flex-grow">
              <h3 className="text-xl font-semibold text-cyan-400 mb-2">存檔欄位 {index + 1}</h3>
              {save ? (
                <div>
                  <p className="text-slate-300 break-all"><strong>主題：</strong> {save.theme}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    <strong>上次遊玩：</strong> {new Date(save.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">空的欄位</p>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {save ? (
                <>
                  <button
                    onClick={() => onLoadGame(index)}
                    className="flex-1 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg text-base"
                  >
                    載入冒險
                  </button>
                  <button
                    onClick={() => handleDownload(index)}
                    className="flex-shrink-0 bg-blue-800/80 text-white font-bold p-2 rounded-lg hover:bg-blue-700/80 transition-all duration-300"
                    title="下載存檔"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteSave(index)}
                    className="flex-shrink-0 bg-red-800/80 text-white font-bold p-2 rounded-lg hover:bg-red-700/80 transition-all duration-300"
                    title="刪除存檔"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="w-full flex gap-3">
                  <button
                    onClick={() => onStartNewGame(index)}
                    className="flex-1 bg-slate-700/70 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600/70 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg text-base"
                  >
                    開啟新冒險
                  </button>
                  <button
                    onClick={() => handleUploadClick(index)}
                    className="flex-shrink-0 bg-teal-800/80 text-white font-bold p-2 rounded-lg hover:bg-teal-700/80 transition-all duration-300"
                    title="上傳存檔"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
