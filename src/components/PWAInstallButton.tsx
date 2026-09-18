import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, inIframe, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  // Ẩn nút nếu app đã được cài đặt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (inIframe) {
       setShowGeneralGuide(true);
       return;
    }
    
    if (isInstallable) {
      try {
        await install();
      } catch (err) {
        console.error("Install prompt failed:", err);
        setShowGeneralGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGeneralGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition"
      >
        <Download size={16} />
        Tải App
      </button>

      {/* Modal hướng dẫn cho iOS */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cài đặt trên iPhone/iPad</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed mb-4">
              1. Nhấn vào nút <strong>Chia sẻ (Share)</strong> ở thanh công cụ Safari phía dưới màn hình.<br/><br/>
              2. Kéo xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-200"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Modal hướng dẫn chung (Android/Chrome khi bị kẹt trong iframe) */}
      {showGeneralGuide && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Hướng dẫn cài đặt thủ công</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed mb-4">
              Hệ thống chưa thể mở hộp thoại cài đặt tự động (do bạn vừa gỡ app, hoặc đang mở web qua Zalo/Messenger).
              <br/><br/>
              <strong>Cách cài đặt nhanh chóng:</strong><br/>
              1. <strong>Nếu mở qua Zalo/Messenger:</strong> Nhấn dấu 3 chấm góc trên, chọn "Mở bằng trình duyệt" (Chrome/Safari).<br/><br/>
              2. <strong>Trên trình duyệt Chrome/Cốc Cốc:</strong> Nhấn vào Menu (dấu 3 chấm ⋮) ở góc phải màn hình trình duyệt, sau đó chọn <strong>"Cài đặt ứng dụng"</strong> (Install app) hoặc <strong>"Thêm vào màn hình chính"</strong>.
            </p>
            <button
              onClick={() => setShowGeneralGuide(false)}
              className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-200"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
