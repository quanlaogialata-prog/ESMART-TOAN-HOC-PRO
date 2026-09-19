import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import AdminDashboard from './admin/ManageTeachers';
import Curriculum from './teacher/Curriculum';
import ManageTests from './teacher/ManageTests';
import ManageSubmissions from './teacher/ManageSubmissions';
import Gradebook from './teacher/Gradebook';
import StudentDashboard from './student/StudentDashboard';
import SettingsModal from '../components/SettingsModal';

type Tab = 'curriculum' | 'tests' | 'grading' | 'gradebook' | 'admin' | 'student';

export default function Dashboard() {
  const { user, role, loading, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(role === 'admin' ? 'admin' : (role === 'teacher' ? 'curriculum' : 'student'));

  if (loading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0 w-full">
        <div className="w-full lg:w-auto flex justify-center lg:justify-start">
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">TRUNG TÂM ESMART <span className="text-sm font-medium text-gray-500 ml-2">| {role?.toUpperCase()}</span></h1>
        </div>
        
                {(role === 'teacher' || role === 'admin') && (
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1">
            {role === 'admin' && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Quản lý
              </button>
            )}
            <button 
              onClick={() => setActiveTab('curriculum')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'curriculum' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Chương trình học
            </button>
            <button 
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'tests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Kho đề & Giao bài
            </button>
            <button 
              onClick={() => setActiveTab('grading')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'grading' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Chấm bài
            </button>
            <button 
              onClick={() => setActiveTab('gradebook')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'gradebook' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Sổ kết quả
            </button>
            
            
          </div>
        )}

        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">{user.displayName}</span>
          <button onClick={() => setShowSettings(true)} className="text-gray-600 hover:text-gray-900 text-sm font-semibold">Cài đặt</button>
          <button onClick={logout} className="text-red-500 hover:text-red-700 text-sm font-semibold">Đăng xuất</button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto min-w-0">
        {role === 'admin' && activeTab === 'admin' && <AdminDashboard />}
        {(role === 'teacher' || role === 'admin') && activeTab === 'curriculum' && <Curriculum />}
        {(role === 'teacher' || role === 'admin') && activeTab === 'tests' && <ManageTests />}
        {(role === 'teacher' || role === 'admin') && activeTab === 'grading' && <ManageSubmissions />}
        {(role === 'teacher' || role === 'admin') && activeTab === 'gradebook' && <Gradebook />}
        {role === 'student' && <StudentDashboard />}
      </main>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
