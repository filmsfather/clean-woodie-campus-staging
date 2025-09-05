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
  organizationId?: string; // 조직 ID 추가
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

export const AuthContext = createContext<AuthContextType | null>(null);

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
        // 저장된 토큰 확인
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!accessToken) {
          // 토큰이 없으면 로그아웃 상태
          setUser(null);
          setIsLoading(false);
          return;
        }

        // 토큰이 있으면 사용자 정보 복원 시도
        // TODO: 실제 환경에서는 토큰으로 사용자 정보 조회
        // 현재는 개발용으로 Mock 데이터 사용
        if (accessToken.startsWith('mock-')) {
          // Mock 토큰인 경우 개발용 사용자 정보 생성
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
          
          const mockUser: AuthUser = {
            id: '1',
            email: userEmail,
            name: userName,
            displayName: userName,
            role: defaultRole,
            organizationId: 'mock-org-1', // Mock 조직 ID
            gradeLevel: defaultRole === 'student' ? 10 : undefined,
            isActive: true
          };
          
          setUser(mockUser);
        } else {
          // 실제 토큰인 경우 API로 사용자 정보 조회
          // TODO: authApi.getCurrentUser() 호출
          setUser(null);
          tokenStorage.clearTokens();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        tokenStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // location.pathname 의존성 제거

  const login = (user: AuthUser, accessToken: string, refreshToken: string) => {
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
    setUser(user);
  };

  const signUp = async (request: SignUpRequest): Promise<void> => {
    try {
      // 실제 API 호출
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
          name: request.name,
          role: request.role,
          classId: request.classId,
          context: request.context
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      
      // 회원가입 후 자동 로그인
      const newUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.fullName,
        displayName: data.user.displayName || data.user.name || data.user.fullName,
        role: data.user.role,
        organizationId: data.user.organizationId,
        gradeLevel: data.user.gradeLevel,
        isActive: data.user.isActive ?? true
      };
      
      login(newUser, data.tokens.accessToken, data.tokens.refreshToken);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
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