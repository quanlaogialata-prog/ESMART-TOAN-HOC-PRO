import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'teacher' | 'student' | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmailPassword: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety fallback timeout: tuyệt đối không để ứng dụng bị kẹt ở trạng thái "Đang tải..."
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      try {
        if (currentUser) {
          const isRobo = currentUser.email === 'robokien36@gmail.com' || currentUser.email === 'admin@toanhoc.pro';

          if (isRobo) {
            setUser(currentUser);
            setRole('admin');
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
                setTimeout(() => reject(new Error('Firestore user doc timeout')), 2500)
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
                }
              } else {
                // User document does NOT exist in Firestore (was deleted or never authorized)
                console.warn("User account not found in 'users' collection. Rejecting access:", currentUser.email);
                await signOut(auth);
                if (isMounted) {
                  setUser(null);
                  setRole(null);
                }
              }
            } catch (docErr) {
              console.warn("Could not load user role from Firestore:", docErr);
              // On error, sign out if not authenticated to prevent unauthorized access
              if (isMounted) {
                await signOut(auth).catch(() => {});
                setUser(null);
                setRole(null);
              }
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setRole(null);
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

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const currentUser = cred.user;
    const isRobo = currentUser.email === 'robokien36@gmail.com' || currentUser.email === 'admin@toanhoc.pro';
    if (!isRobo) {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('Tài khoản Google này chưa được cấp quyền trong hệ thống. Vui lòng liên hệ Quản trị viên.');
      }
      const data = userDoc.data();
      if (data?.disabled === true || data?.status === 'deleted') {
        await signOut(auth);
        throw new Error('Tài khoản này đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Quản trị viên.');
      }
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const currentUser = cred.user;
    const isRobo = currentUser.email === 'robokien36@gmail.com' || currentUser.email === 'admin@toanhoc.pro';
    if (!isRobo) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          await signOut(auth);
          throw new Error('Tài khoản này không tồn tại trong danh sách hoặc đã bị xóa bởi Quản trị viên.');
        }
        const data = userDoc.data();
        if (data?.disabled === true || data?.status === 'deleted') {
          await signOut(auth);
          throw new Error('Tài khoản này đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Quản trị viên.');
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('không tồn tại') || err.message.includes('bị xóa') || err.message.includes('bị khóa'))) {
          throw err;
        }
        console.error("Login verification error:", err);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, loginWithEmailPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
