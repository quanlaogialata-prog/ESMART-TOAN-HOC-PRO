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

      {/* Modal hướng dẫn chung (Android/Chrome khi bị kẹt trong iframe hoặc cần cài đặt thủ công) */}
      {showGeneralGuide && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative border border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <Download className="text-indigo-600" size={20} />
              <span>Cài đặt ứng dụng ESMART (PWA)</span>
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Bạn có thể tải và cài đặt hệ thống ESMART trực tiếp về điện thoại (Android, iOS) hoặc máy tính (Windows, Mac) để truy cập nhanh như ứng dụng native không cần cài qua App Store / Google Play.
            </p>

            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700 mb-5">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <span>📌 Bước 1: Mở trên trình duyệt web độc lập</span>
              </div>
              <p className="text-gray-600 pl-4">
                Nếu bạn đang mở trong khung xem trước hoặc Zalo/Facebook, vui lòng mở liên kết trực tiếp trên trình duyệt <strong>Google Chrome</strong>, <strong>Safari</strong> hoặc <strong>Cốc Cốc</strong>:
              </p>
              <div className="pl-4 pt-1">
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm text-xs transition-all"
                >
                  <span>Mở tab mới trên trình duyệt</span>
                  <span className="text-[10px] bg-indigo-500 px-1.5 py-0.5 rounded">Mới</span>
                </a>
              </div>

              <div className="font-bold text-indigo-950 flex items-center gap-1.5 pt-2 border-t border-gray-200">
                <span>📌 Bước 2: Nhấn Cài đặt ứng dụng</span>
              </div>
              <ul className="list-disc pl-8 space-y-1 text-gray-600">
                <li><strong>Trên máy tính (Chrome/Edge):</strong> Nhấn vào biểu tượng <strong>Cài đặt</strong> (hình máy tính nhỏ có mũi tên tải xuống) ở thanh địa chỉ URL hoặc menu 3 chấm ⋮ &gt; <em>Cài đặt ESMART</em>.</li>
                <li><strong>Trên điện thoại Android:</strong> Nhấn menu 3 chấm ⋮ góc phải &gt; <em>"Cài đặt ứng dụng"</em> hoặc <em>"Thêm vào màn hình chính"</em>.</li>
                <li><strong>Trên iPhone/iPad (Safari):</strong> Nhấn nút <em>Chia sẻ</em> (biểu tượng ô vuông mũi tên lên) &gt; chọn <em>"Thêm vào MH chính" (Add to Home Screen)</em>.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowGeneralGuide(false)}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white hover:bg-black transition-all cursor-pointer shadow-sm"
            >
              Đã hiểu, đóng hướng dẫn
            </button>
          </div>
        </div>
      )}
    </>
  );
};
