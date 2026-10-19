import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { ShieldCheck, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export default function Login() {
  const { user, loginWithGoogle, loginWithEmailPassword, loginAsQuickRole, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-600 font-medium text-sm">Đang tải hệ thống ESMART...</div>
      </div>
    );
  }
  if (user) return <Navigate to="/" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập tên truy cập và mật khẩu');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const email = username.includes('@') ? username : `${username.toLowerCase()}@toanhoc.pro`;
      await loginWithEmailPassword(email, password);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Tên truy cập hoặc mật khẩu không đúng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('khóa')) {
        setError(err.message);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError('Đăng nhập Google thất bại: ' + (err.message || 'Lỗi xác thực'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
        
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-3 font-bold text-xl">
          E
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">TRUNG TÂM ESMART</h1>
        <p className="text-slate-500 text-sm mb-6">Hệ thống ôn tập và kiểm tra môn Toán</p>
        
        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm text-left border border-red-100">
            {error}
          </div>
        )}

        {/* Quick Access Roles */}
        <div className="mb-6 space-y-2 text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Vào nhanh giao diện hệ thống
          </div>

          <button
            type="button"
            onClick={() => loginAsQuickRole('teacher')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-900">Vào với tư cách Giáo viên</div>
                <div className="text-xs text-blue-700">Tạo đề từ đề tải lên, chuyên đề, biểu điểm</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-blue-500 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            type="button"
            onClick={() => loginAsQuickRole('admin')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/70 transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-purple-900">Vào Quản trị viên (Admin)</div>
                <div className="text-xs text-purple-700">Tài khoản robokien36@gmail.com</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-purple-500 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            type="button"
            onClick={() => loginAsQuickRole('student')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-900">Vào với tư cách Học sinh</div>
                <div className="text-xs text-emerald-700">Giao diện làm bài kiểm tra online</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-emerald-500 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400 uppercase tracking-wider font-medium">Hoặc đăng nhập với tài khoản</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 mb-4">
          <div>
            <input 
              type="text" 
              placeholder="Tên truy cập hoặc email" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm cursor-pointer shadow-sm"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập tài khoản'}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-2xs"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
          Đăng nhập với Google
        </button>

        <div className="mt-5 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
}
