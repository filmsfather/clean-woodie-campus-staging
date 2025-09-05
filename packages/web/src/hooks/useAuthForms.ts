import { useState, useCallback } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  SignInFormState, 
  SignUpFormState, 
  AuthActionResult 
} from '../types/auth';

/**
 * useAuthForms - 인증 폼 관리를 위한 커스텀 훅
 * 
 * SignInForm, SignUpForm 컴포넌트와 연결
 * SignInUseCase, SignUpUseCase와 연동
 */

interface UseAuthFormsOptions {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface AuthFormState {
  isLoading: boolean;
  error: string | null;
  isSubmitted: boolean;
}

interface UseAuthFormsReturn {
  // 로그인 폼
  signInState: AuthFormState;
  signInForm: SignInFormState;
  setSignInForm: React.Dispatch<React.SetStateAction<SignInFormState>>;
  handleSignIn: (formData: SignInFormState) => Promise<AuthActionResult>;
  resetSignInForm: () => void;
  
  // 회원가입 폼
  signUpState: AuthFormState;
  signUpForm: SignUpFormState;
  setSignUpForm: React.Dispatch<React.SetStateAction<SignUpFormState>>;
  handleSignUp: (formData: SignUpFormState) => Promise<AuthActionResult>;
  resetSignUpForm: () => void;
  
  // 비밀번호 재설정
  resetPasswordState: AuthFormState;
  handlePasswordReset: (email: string) => Promise<AuthActionResult>;
  
  // 유틸리티
  validateEmail: (email: string) => string | null;
  validatePassword: (password: string) => string | null;
  validatePasswordConfirm: (password: string, confirmPassword: string) => string | null;
  validateFullName: (name: string) => string | null;
  
  // 상태 관리
  clearErrors: () => void;
  isAnyLoading: () => boolean;
}

const initialSignInForm: SignInFormState = {
  email: '',
  password: '',
  rememberMe: false
};

const initialSignUpForm: SignUpFormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  acceptTerms: false,
  inviteToken: undefined
};

const initialFormState: AuthFormState = {
  isLoading: false,
  error: null,
  isSubmitted: false
};

export const useAuthForms = (options: UseAuthFormsOptions = {}): UseAuthFormsReturn => {
  const { redirectTo, onSuccess, onError } = options;
  const { login, signUp } = useAuth();

  // 폼 상태
  const [signInState, setSignInState] = useState<AuthFormState>(initialFormState);
  const [signInForm, setSignInForm] = useState<SignInFormState>(initialSignInForm);
  
  const [signUpState, setSignUpState] = useState<AuthFormState>(initialFormState);
  const [signUpForm, setSignUpForm] = useState<SignUpFormState>(initialSignUpForm);
  
  const [resetPasswordState, setResetPasswordState] = useState<AuthFormState>(initialFormState);

  // 로그인 처리
  const handleSignIn = useCallback(async (formData: SignInFormState): Promise<AuthActionResult> => {
    try {
      setSignInState({ isLoading: true, error: null, isSubmitted: false });
      
      const requestData = {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        context: {
          userAgent: navigator.userAgent,
          locale: navigator.language,
          redirectUrl: redirectTo
        }
      };
      
      const response = await authApi.signIn(requestData);
      
      // AuthContext에 사용자 정보 저장
      login(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.fullName,
          displayName: response.user.displayName,
          role: response.user.role as 'student' | 'teacher' | 'admin',
          gradeLevel: response.user.gradeLevel,
          avatarUrl: response.user.avatarUrl,
          isActive: true
        },
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      setSignInState({ isLoading: false, error: null, isSubmitted: true });
      onSuccess?.();
      
      return {
        success: true,
        message: '로그인에 성공했습니다.',
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setSignInState({ isLoading: false, error: errorMessage, isSubmitted: false });
      onError?.(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [login, redirectTo, onSuccess, onError]);

  // 회원가입 처리
  const handleSignUp = useCallback(async (formData: SignUpFormState): Promise<AuthActionResult> => {
    try {
      setSignUpState({ isLoading: true, error: null, isSubmitted: false });
      
      // 비밀번호 확인 검증
      if (formData.password !== formData.confirmPassword) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
      
      // 이용약관 동의 확인
      if (!formData.acceptTerms) {
        throw new Error('이용약관에 동의해주세요.');
      }
      
      const requestData = {
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        role: 'student' as const, // 기본값
        inviteToken: formData.inviteToken,
        context: {
          userAgent: navigator.userAgent,
          locale: navigator.language,
          redirectUrl: redirectTo
        }
      };
      
      const response = await authApi.signUp(requestData);
      
      // 회원가입 성공 시 자동 로그인 처리 (response에 토큰이 있는 경우)
      if (response.tokens) {
        login(
          {
            id: response.user.id,
            email: response.user.email,
            name: response.user.fullName,
            displayName: response.user.displayName,
            role: response.user.role as 'student' | 'teacher' | 'admin',
            gradeLevel: response.user.gradeLevel,
            avatarUrl: response.user.avatarUrl,
            isActive: true
          },
          response.tokens.accessToken,
          response.tokens.refreshToken
        );
      }
      
      setSignUpState({ isLoading: false, error: null, isSubmitted: true });
      onSuccess?.();
      
      const message = response.isActivationRequired 
        ? '회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.'
        : '회원가입이 완료되었습니다.';
      
      return {
        success: true,
        message,
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      setSignUpState({ isLoading: false, error: errorMessage, isSubmitted: false });
      onError?.(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [login, redirectTo, onSuccess, onError]);

  // 비밀번호 재설정
  const handlePasswordReset = useCallback(async (email: string): Promise<AuthActionResult> => {
    try {
      setResetPasswordState({ isLoading: true, error: null, isSubmitted: false });
      
      const response = await authApi.requestPasswordReset({
        email,
        context: {
          locale: navigator.language,
          redirectUrl: redirectTo
        }
      });
      
      setResetPasswordState({ isLoading: false, error: null, isSubmitted: true });
      
      return {
        success: true,
        message: response.message,
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정 요청에 실패했습니다.';
      setResetPasswordState({ isLoading: false, error: errorMessage, isSubmitted: false });
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [redirectTo]);

  // 폼 초기화 함수들
  const resetSignInForm = useCallback(() => {
    setSignInForm(initialSignInForm);
    setSignInState(initialFormState);
  }, []);

  const resetSignUpForm = useCallback(() => {
    setSignUpForm(initialSignUpForm);
    setSignUpState(initialFormState);
  }, []);

  // 유효성 검증 함수들
  const validateEmail = useCallback((email: string): string | null => {
    if (!email) {
      return '이메일을 입력해주세요.';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '유효한 이메일 주소를 입력해주세요.';
    }
    
    return null;
  }, []);

  const validatePassword = useCallback((password: string): string | null => {
    if (!password) {
      return '비밀번호를 입력해주세요.';
    }
    
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.';
    }
    
    // 복잡성 검증 (선택사항)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return '비밀번호는 영문과 숫자를 포함해야 합니다.';
    }
    
    return null;
  }, []);

  const validatePasswordConfirm = useCallback((password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) {
      return '비밀번호 확인을 입력해주세요.';
    }
    
    if (password !== confirmPassword) {
      return '비밀번호가 일치하지 않습니다.';
    }
    
    return null;
  }, []);

  const validateFullName = useCallback((name: string): string | null => {
    if (!name) {
      return '이름을 입력해주세요.';
    }
    
    if (name.trim().length < 2) {
      return '이름은 최소 2자 이상이어야 합니다.';
    }
    
    return null;
  }, []);

  // 유틸리티 함수들
  const clearErrors = useCallback(() => {
    setSignInState(prev => ({ ...prev, error: null }));
    setSignUpState(prev => ({ ...prev, error: null }));
    setResetPasswordState(prev => ({ ...prev, error: null }));
  }, []);

  const isAnyLoading = useCallback(() => {
    return signInState.isLoading || signUpState.isLoading || resetPasswordState.isLoading;
  }, [signInState.isLoading, signUpState.isLoading, resetPasswordState.isLoading]);

  return {
    // 로그인 폼
    signInState,
    signInForm,
    setSignInForm,
    handleSignIn,
    resetSignInForm,
    
    // 회원가입 폼
    signUpState,
    signUpForm,
    setSignUpForm,
    handleSignUp,
    resetSignUpForm,
    
    // 비밀번호 재설정
    resetPasswordState,
    handlePasswordReset,
    
    // 유틸리티
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    validateFullName,
    
    // 상태 관리
    clearErrors,
    isAnyLoading
  };
};