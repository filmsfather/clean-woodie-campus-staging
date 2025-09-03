import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { UserRole } from '@woodie/domain';
import { tokenStorage } from '../utils/auth';

// ProfileDto와 동일한 구조로 수정 (추후 실제 DTO import 예정)
interface AuthUser {
  id: string;
  email: string;
  name: string; // fullName에서 간단히 name으로 매핑
  displayName: string;
  role: UserRole;
  gradeLevel?: number;
  avatarUrl?: string;
  isActive: boolean;
}

interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  classId?: string;
  context?: {
    ip?: string;
    userAgent?: string;
    locale?: string;
    redirectUrl?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  signUp: (request: SignUpRequest) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // URL에서 역할 확인 (개발용)
        const currentPath = location.pathname;
        let defaultRole: UserRole = 'student';
        let userName = '김학생';
        let userEmail = 'student@woodie.com';
        
        if (currentPath.startsWith('/teacher') || currentPath.startsWith('/manage')) {
          defaultRole = 'teacher';
          userName = '김교사';
          userEmail = 'teacher@woodie.com';
        } else if (currentPath.startsWith('/admin')) {
          defaultRole = 'admin';
          userName = '관리자';
          userEmail = 'admin@woodie.com';
        }
        
        // 개발 환경에서는 항상 Mock 사용자로 로그인
        const mockUser: AuthUser = {
          id: '1',
          email: userEmail,
          name: userName,
          displayName: userName,
          role: defaultRole,
          gradeLevel: defaultRole === 'student' ? 10 : undefined,
          isActive: true
        };
        
        // Mock 토큰 설정
        tokenStorage.setAccessToken('mock-access-token');
        tokenStorage.setRefreshToken('mock-refresh-token');
        setUser(mockUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [location.pathname]);

  const login = (user: AuthUser, accessToken: string, refreshToken: string) => {
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
    setUser(user);
  };

  const signUp = async (request: SignUpRequest): Promise<void> => {
    // Mock 회원가입 구현 (실제 환경에서는 SignUpUseCase 호출)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
    
    // 회원가입 후 자동 로그인
    const newUser: AuthUser = {
      id: Date.now().toString(),
      email: request.email,
      name: request.name,
      displayName: request.name,
      role: request.role,
      gradeLevel: request.role === 'student' ? 10 : undefined,
      isActive: true
    };
    
    const mockAccessToken = 'mock-access-token-' + Date.now();
    const mockRefreshToken = 'mock-refresh-token-' + Date.now();
    
    login(newUser, mockAccessToken, mockRefreshToken);
  };

  const logout = () => {
    tokenStorage.clearTokens();
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signUp,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};