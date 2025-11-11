import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

interface AdminUser {
  id: string;
  email: string;
  name_ar: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // يمكنك تخزين حالة المصادقة في AsyncStorage للتطبيقات الحقيقية
      // هنا سأستخدم حالة بسيطة للتوضيح
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // البحث عن المستخدم في جدول admin_users
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        Alert.alert('خطأ', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        return false;
      }

      // في التطبيق الحقيقي، يجب استخدام التجزئة المناسبة مثل bcrypt
      // هنا سأستخدم مقارنة مباشرة للتوضيح
      if (data.password_hash !== password) {
        Alert.alert('خطأ', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        return false;
      }

      const user: AdminUser = {
        id: data.id,
        email: data.email,
        name_ar: data.name_ar,
        role: data.role
      };

      setAdminUser(user);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ 
      isAuthenticated, 
      adminUser, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};