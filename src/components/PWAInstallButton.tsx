import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  // Ẩn nút nếu app đã được cài đặt và đang chạy ở chế độ standalone
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Trường hợp trình duyệt chưa cấp quyền cài tự động (có thể do đang ở trong iframe hoặc trình duyệt không hỗ trợ)
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
        Cài đặt App
      </button>

      {/* Modal hướng dẫn cho iOS */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Hướng dẫn cài đặt</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed mb-4">
              Nếu bạn đang xem ứng dụng trong khung xem trước (iframe), tính năng cài đặt tự động sẽ bị trình duyệt chặn.
              <br/><br/>
              <strong>Cách khắc phục:</strong><br/>
              1. Nhấn nút <strong>Mở trong thẻ mới (Open in new tab)</strong> ở góc trên cùng của khung xem trước này.<br/>
              2. Ở thẻ mới, bạn có thể nhấn nút Cài đặt App này một lần nữa, hoặc mở menu trình duyệt (dấu 3 chấm) và chọn <strong>"Cài đặt ứng dụng"</strong> (Install app) / <strong>"Thêm vào màn hình chính"</strong>.
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
