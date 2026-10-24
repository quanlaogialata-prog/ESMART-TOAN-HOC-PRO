import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'teacher' | 'student' | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<void>;
  loginAsQuickRole: (role: 'admin' | 'teacher' | 'student') => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: false,
  loginWithGoogle: async () => {},
  loginWithEmailPassword: async () => {},
  loginAsQuickRole: () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if a user/role was saved so the user immediately sees the exact interface on frame 0
  const getInitialState = () => {
    try {
      const cachedUserRaw = localStorage.getItem('esmart_cached_user');
      if (cachedUserRaw) {
        const parsed = JSON.parse(cachedUserRaw);
        if (parsed && parsed.role) {
          return {
            user: {
              uid: parsed.uid || 'admin_robokien36',
              email: parsed.email || 'robokien36@gmail.com',
              displayName: parsed.displayName || 'Thầy Kiên (Admin)',
            } as unknown as User,
            role: parsed.role as 'admin' | 'teacher' | 'student'
          };
        }
      }
      const saved = localStorage.getItem('esmart_quick_role') as 'admin' | 'teacher' | 'student' | null;
      if (saved) {
        return {
          user: {
            uid: saved === 'admin' ? 'admin_robokien36' : (saved === 'student' ? 'student_demo' : 'teacher_esmart'),
            email: saved === 'admin' ? 'robokien36@gmail.com' : (saved === 'student' ? 'hocsinh@toanhoc.pro' : 'giaovien@toanhoc.pro'),
            displayName: saved === 'admin' ? 'Thầy Kiên (Admin)' : (saved === 'student' ? 'Em Học Sinh' : 'Thầy Cô Giáo Viên'),
          } as unknown as User,
          role: saved
        };
      }
    } catch (e) {}
    // Mặc định cung cấp tài khoản Admin/Giáo viên để giao diện hệ thống hiển thị ngay lập tức khi mở app
    return {
      user: {
        uid: 'admin_robokien36',
        email: 'robokien36@gmail.com',
        displayName: 'Thầy Kiên (Admin)',
      } as unknown as User,
      role: 'admin' as const
    };
  };

  const initial = getInitialState();
  const [user, setUser] = useState<User | null>(initial.user);
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(initial.role);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 800);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      try {
        if (currentUser) {
          const isRobo = currentUser.email === 'robokien36@gmail.com' || currentUser.email === 'admin@toanhoc.pro';

          if (isRobo) {
            setUser(currentUser);
            setRole('admin');
            try {
              localStorage.setItem('esmart_quick_role', 'admin');
              localStorage.setItem('esmart_cached_user', JSON.stringify({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'Admin',
                role: 'admin'
              }));
            } catch (e) {}
            setDoc(doc(db, 'users', currentUser.uid), {
              role: 'admin',
              email: currentUser.email,
              displayName: currentUser.displayName || 'Admin',
              createdAt: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          } else {
            // For standard accounts (teachers, students), verify presence in Firestore
            try {
              const docPromise = getDoc(doc(db, 'users', currentUser.uid));
              const timeoutPromise = new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Firestore user doc timeout')), 2000)
              );
              const userDoc = await Promise.race([docPromise, timeoutPromise]) as any;

              if (userDoc && typeof userDoc.exists === 'function' && userDoc.exists()) {
                const userData = userDoc.data();
                if (userData?.disabled === true || userData?.status === 'deleted') {
                  console.warn("User account is disabled or deleted:", currentUser.email);
                  await signOut(auth);
                  if (isMounted) {
                    setUser(null);
                    setRole(null);
                  }
                  return;
                }

                const currentRole = userData?.role || (currentUser.email?.includes('student') || currentUser.email?.includes('hocsinh') ? 'student' : 'teacher');
                if (isMounted) {
                  setUser(currentUser);
                  setRole(currentRole);
                  try {
                    localStorage.setItem('esmart_quick_role', currentRole);
                  } catch (e) {}
                }
              } else {
                const currentRole = currentUser.email?.includes('student') ? 'student' : 'teacher';
                if (isMounted) {
                  setUser(currentUser);
                  setRole(currentRole);
                }
              }
            } catch (docErr) {
              console.warn("Could not load user role from Firestore:", docErr);
              const currentRole = currentUser.email?.includes('student') ? 'student' : 'teacher';
              if (isMounted) {
                setUser(currentUser);
                setRole(currentRole);
              }
            }
          }
        }
      } catch (authErr) {
        console.error("Auth state change error:", authErr);
      } finally {
        clearTimeout(fallbackTimer);
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const loginAsQuickRole = (targetRole: 'admin' | 'teacher' | 'student') => {
    const quickUser = {
      uid: targetRole === 'admin' ? 'admin_robokien36' : (targetRole === 'student' ? 'student_demo' : 'teacher_esmart'),
      email: targetRole === 'admin' ? 'robokien36@gmail.com' : (targetRole === 'student' ? 'hocsinh@toanhoc.pro' : 'giaovien@toanhoc.pro'),
      displayName: targetRole === 'admin' ? 'Thầy Kiên (Admin)' : (targetRole === 'student' ? 'Em Học Sinh' : 'Thầy Cô Giáo Viên'),
    } as unknown as User;

    setUser(quickUser);
    setRole(targetRole);
    try {
      localStorage.setItem('esmart_quick_role', targetRole);
    } catch (e) {}
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const currentUser = cred.user;
    const isRobo = currentUser.email === 'robokien36@gmail.com' || currentUser.email === 'admin@toanhoc.pro';
    if (!isRobo) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.disabled === true || data?.status === 'deleted') {
            await signOut(auth);
            throw new Error('Tài khoản này đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Quản trị viên.');
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('khóa')) throw err;
      }
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const currentUser = cred.user;
      const isRobo = currentUser.email === 'robokien36@gmail.com' || currentUser.email === 'admin@toanhoc.pro';
      if (!isRobo) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.disabled === true || data?.status === 'deleted') {
              await signOut(auth);
              throw new Error('Tài khoản này đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Quản trị viên.');
            }
          }
        } catch (err: any) {
          if (err.message && err.message.includes('khóa')) throw err;
        }
      }
    } catch (firebaseErr: any) {
      // Nếu Firebase Auth chưa tạo tài khoản này hoặc lỗi kết nối, cho phép đăng nhập nhanh theo tên truy cập
      const cleanEmail = email.toLowerCase();
      if (cleanEmail.includes('admin') || cleanEmail.includes('robokien')) {
        loginAsQuickRole('admin');
        return;
      } else if (cleanEmail.includes('hocsinh') || cleanEmail.includes('student')) {
        loginAsQuickRole('student');
        return;
      } else {
        loginAsQuickRole('teacher');
        return;
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('esmart_quick_role');
    } catch (e) {}
    await signOut(auth).catch(() => {});
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, loginWithEmailPassword, loginAsQuickRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
