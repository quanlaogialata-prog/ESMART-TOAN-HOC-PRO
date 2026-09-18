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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Hướng dẫn cài đặt</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed mb-4">
              Trình duyệt đang chặn tính năng này do bạn đang xem ứng dụng qua một ứng dụng khác (ví dụ: Zalo, Messenger, Facebook).
              <br/><br/>
              <strong>Cách khắc phục:</strong><br/>
              1. Copy đường link (URL) của trang web hiện tại.<br/><br/>
              2. Mở trình duyệt web của bạn (Chrome, Safari,...) và dán link vào để truy cập.
<br/><br/>
3. Ở trình duyệt đó, bạn nhấn lại nút Tải App này để cài đặt.
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
