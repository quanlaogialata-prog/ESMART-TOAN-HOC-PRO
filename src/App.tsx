/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';

const Login = lazy(() => import('./pages/Login'));
const DoAssignment = lazy(() => import('./pages/student/DoAssignment'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-600 font-medium text-xs">Đang tải trang...</div>
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/assignment/:assignmentId" element={<DoAssignment />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
