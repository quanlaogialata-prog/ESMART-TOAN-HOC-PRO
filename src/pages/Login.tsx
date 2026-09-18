import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import { PWAInstallButton } from '../components/PWAInstallButton';

export default function Login() {
  const { user, loginWithGoogle, loginWithEmailPassword, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
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
      // Map username to pseudo-email if it's not an email
      const email = username.includes('@') ? username : `${username.toLowerCase()}@toanhoc.pro`;
      await loginWithEmailPassword(email, password);
    } catch (err: any) {
      console.error(err);
      setError('Tên truy cập hoặc mật khẩu không đúng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        
        <h1 className="text-3xl font-bold text-blue-600 mb-2">TRUNG TÂM ESMART KB</h1>
        <p className="text-gray-600 mb-8">Hệ thống ôn tập và kiểm tra môn Toán</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <input 
              type="text" 
              placeholder="Tên truy cập" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-left"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-left"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Hoặc</span>
          </div>
        </div>

        <button
          onClick={loginWithGoogle}
          type="button"
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Đăng nhập với Google
        </button>

        <div className="mt-6 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
}
