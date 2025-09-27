import React, { useState, useEffect, useRef } from 'react';
import LoadingIcon from './LoadingIcon';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';


interface CharacterCreationProps {
  onConfirm: (name: string, background: string, avatar: string | null) => void;
  isLoading: boolean;
  loadingMessage: string;
  theme: string | null;
  initialIntroduction: string | null;
  onGenerateAvatar: (introduction: string) => Promise<string | null>;
}

const randomNames = [
    '艾拉', '雷戈', '莉娜', '卡恩', '莎拉',
    '傑斯', '諾娃', '瑞克', '菲歐', '洛奇'
];

/**
 * Resizes a base64 encoded image to 160x160 pixels.
 * @param base64Str The base64 string of the image (without the data URL prefix).
 * @returns A promise that resolves with the resized base64 string.
 */
const resizeImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('無法獲取畫布上下文'));
      }
      // Preserve pixel art style during scaling
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, 160, 160);
      const dataUrl = canvas.toDataURL('image/png');
      const resizedBase64 = dataUrl.split(',')[1];
      resolve(resizedBase64);
    };
    img.onerror = () => {
      reject(new Error('讀取生成圖片時發生錯誤'));
    };
    img.src = `data:image/png;base64,${base64Str}`;
  });
};

// Helper to create a centered aspect crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

// Utility to get cropped image data
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('無法獲取 2D 上下文');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        160,
        160
    );

    return new Promise((resolve) => {
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        resolve(base64);
    });
}


const ImageCropperModal: React.FC<{
  src: string;
  onConfirm: (croppedImageBase64: string) => void;
  onCancel: () => void;
}> = ({ src, onConfirm, onCancel }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [scale, setScale] = useState(1);
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }

    async function handleConfirmCrop() {
        if (completedCrop && imgRef.current) {
            try {
                const croppedImageBase64 = await getCroppedImg(imgRef.current, completedCrop);
                onConfirm(croppedImageBase64);
            } catch (e) {
                console.error("Cropping failed:", e);
            }
        }
    }

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      setScale((prevScale) => Math.min(Math.max(0.5, prevScale - e.deltaY * 0.001), 4));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-slate-800 w-full max-w-md rounded-lg shadow-2xl border border-slate-700 flex flex-col"
                 onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-slate-600">
                    <h3 className="text-lg font-bold text-cyan-300 text-center">裁切你的頭像</h3>
                </header>
                <div className="p-4 overflow-hidden flex justify-center items-center bg-slate-900/50" onWheel={handleWheel}>
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        minWidth={50}
                        minHeight={50}
                        circularCrop={true}
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={src}
                            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </div>
                <p className="text-xs text-slate-500 text-center p-2">使用滑鼠滾輪縮放圖片</p>
                <footer className="p-3 flex justify-end gap-3 border-t border-slate-600">
                    <button onClick={onCancel} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all duration-300">
                        取消
                    </button>
                    <button onClick={handleConfirmCrop}
                            disabled={!completedCrop?.width || !completedCrop?.height}
                            className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300">
                        確認
                    </button>
                </footer>
            </div>
        </div>
    );
};


const CharacterCreation: React.FC<CharacterCreationProps> = ({ 
  onConfirm, 
  isLoading, 
  loadingMessage, 
  theme, 
  initialIntroduction,
  onGenerateAvatar
}) => {
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [base64Input, setBase64Input] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (initialIntroduction) {
      setBackground(initialIntroduction);
    }
  }, [initialIntroduction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      let finalName = name.trim();
      if (!finalName) {
        finalName = randomNames[Math.floor(Math.random() * randomNames.length)];
      }
      onConfirm(finalName, background.trim(), avatar);
    }
  };

  const handleGenerateClick = async () => {
    if (!background.trim()) {
      alert("請先填寫或確認腳色介紹，才能生成頭像。");
      return;
    }
    setIsGeneratingAvatar(true);
    setUploadError(null);
    try {
      const generatedAvatar = await onGenerateAvatar(background);
      if (generatedAvatar) {
        const resizedAvatar = await resizeImage(generatedAvatar);
        setAvatar(resizedAvatar);
        setBase64Input(''); // 清空文字輸入區
      }
    } catch (error) {
      console.error("Avatar generation or resizing failed:", error);
      const errorMessage = error instanceof Error ? error.message : '生成或處理頭像時發生未知錯誤。';
      setUploadError(errorMessage);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setUploadError('檔案格式錯誤，請上傳 PNG 或 JPG 圖片。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        setCropImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 重設檔案輸入值
    if (event.target) event.target.value = '';
  };
  
  const handleBase64InputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBase64Input(value);
    setAvatar(value.trim());
  };
  
  const handleCopyClick = () => {
    if (!avatar) return;
    navigator.clipboard.writeText(avatar).then(() => {
      setCopySuccess(true);
      
      let start: number | null = null;
      const resetAfter2s = (timestamp: number) => {
        if (start === null) {
          start = timestamp;
        }
        const elapsed = timestamp - start;
        if (elapsed < 2000) {
          requestAnimationFrame(resetAfter2s);
        } else {
          setCopySuccess(false);
        }
      };
      requestAnimationFrame(resetAfter2s);
    });
  };

  const handleCropConfirm = (croppedBase64: string) => {
      setAvatar(croppedBase64);
      setCropImageSrc(null);
      setBase64Input('');
  };

  return (
    <>
      {cropImageSrc && (
          <ImageCropperModal
              src={cropImageSrc}
              onConfirm={handleCropConfirm}
              onCancel={() => setCropImageSrc(null)}
          />
      )}
      <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-2 text-center">創建你的角色</h2>
        <p className="text-slate-400 mb-6 text-center">你的冒險主題是：<strong className="text-cyan-400">{theme || '未知'}</strong></p>
        
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Name and Background */}
            <div className="space-y-6">
              <div>
                <label htmlFor="character-name" className="block text-lg font-medium text-slate-300 mb-2">你的名字</label>
                <input
                  id="character-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`例如：${randomNames[0]}`}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-slate-500 text-center mt-2">
                  若留白，將會隨機產生一個名字。
                </p>
              </div>

              <div>
                <label htmlFor="character-introduction" className="block text-lg font-medium text-slate-300 mb-2">你的腳色介紹</label>
                <textarea
                  id="character-introduction"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder={initialIntroduction ? '' : '正在生成腳色介紹...'}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500 h-48 resize-y"
                  disabled={isLoading || !initialIntroduction}
                />
                <p className="text-xs text-slate-500 text-center mt-2">
                  這是 AI 為你生成的腳色介紹，你可以自由修改它。
                </p>
              </div>
            </div>

            {/* Right Column: Avatar */}
            <div className="space-y-4 flex flex-col">
              <label className="block text-lg font-medium text-slate-300">角色頭像</label>
              <div className="w-[160px] h-[160px] mx-auto bg-slate-900/50 rounded-lg border-2 border-slate-700 flex items-center justify-center p-1">
                  {avatar ? (
                      <img src={`data:image/png;base64,${avatar}`} alt="角色頭像預覽" className="w-full h-full object-contain pixelated-image" />
                  ) : (
                      <div className="text-slate-500 text-center text-xs">預覽</div>
                  )}
              </div>
              
              {uploadError && <p className="text-red-400 text-xs text-center">{uploadError}</p>}

              <div className="space-y-3">
                <button type="button" onClick={handleGenerateClick} disabled={isLoading || isGeneratingAvatar || !background.trim()} className="w-full bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center">
                  {isGeneratingAvatar && <LoadingIcon />}
                  {isGeneratingAvatar ? '生成中...' : '依介紹生成頭像'}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png,image/jpeg" className="hidden" />
                <button type="button" onClick={handleUploadClick} disabled={isLoading} className="w-full bg-slate-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300">
                  上傳圖片 (PNG / JPG)
                </button>
              </div>

              <div className="flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="avatar-base64" className="text-sm text-slate-400">或貼上 Base64</label>
                    {avatar && (
                      <button type="button" onClick={handleCopyClick} className="text-xs bg-slate-600 hover:bg-slate-500 text-white font-bold py-1 px-2 rounded transition-colors duration-200">
                          {copySuccess ? '已複製！' : '複製目前頭像'}
                      </button>
                    )}
                  </div>
                  <textarea 
                      id="avatar-base64"
                      value={base64Input}
                      onChange={handleBase64InputChange}
                      placeholder="在此貼上圖片的 Base64 字串..."
                      className="w-full flex-grow bg-slate-900 border border-slate-600 rounded-md p-2 text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500 resize-y"
                      disabled={isLoading}
                  />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <button
              type="submit"
              disabled={isLoading || !background.trim()}
              className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto flex items-center justify-center mx-auto"
            >
              {isLoading ? (
                <>
                  <LoadingIcon />
                  {loadingMessage || '處理中...'}
                </>
              ) : (
                '開始冒險'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CharacterCreation;
