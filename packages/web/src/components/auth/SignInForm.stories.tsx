import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SignInForm } from './SignInForm';
import { AuthActionResult } from '../../types/auth';

const meta: Meta<typeof SignInForm> = {
  title: 'Auth/SignInForm',
  component: SignInForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**SignInForm** - SignInUseCase에 대응하는 로그인 폼 컴포넌트

Clean Architecture & DDD 원칙 준수:
- UI는 순수하게 사용자 입력만 처리, 비즈니스 로직은 UseCase로 위임
- DTO-First: SignInFormState 타입으로 Application Layer와 일관성
- 도메인 규칙을 UI 검증에 반영 (이메일 형식, 비밀번호 최소 길이 등)
- Feature Flag로 회원가입/비밀번호 재설정 링크 제어

**4가지 UI 상태:**
- Loading: 로그인 처리 중
- Empty: 초기 상태
- Error: 로그인 실패
- OK: 정상 입력 상태
        `
      }
    }
  },
  argTypes: {
    onSubmit: {
      action: 'submitted',
      description: 'SignInUseCase 호출 함수'
    },
    isLoading: {
      control: 'boolean',
      description: '로딩 상태 여부'
    },
    error: {
      control: 'text',
      description: '서버 에러 메시지'
    },
    onForgotPassword: {
      action: 'forgot-password-clicked',
      description: '비밀번호 재설정 클릭 핸들러'
    },
    onSignUpRedirect: {
      action: 'signup-redirect-clicked',
      description: '회원가입 페이지 이동 핸들러'
    }
  }
};

export default meta;
type Story = StoryObj<typeof SignInForm>;

// Mock 함수들
const mockSubmit = async (formData: any): Promise<AuthActionResult> => {
  // 실제 구현에서는 SignInUseCase 호출
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (formData.email === 'error@test.com') {
    return { success: false, message: 'Invalid credentials' };
  }
  return { success: true, message: 'Login successful', data: { userId: 'user-1' } };
};

// 1. Loading 상태 - 로그인 처리 중
export const Loading: Story = {
  name: '📡 Loading',
  args: {
    onSubmit: mockSubmit,
    isLoading: true,
    error: null,
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  parameters: {
    docs: {
      description: {
        story: '사용자가 로그인 버튼을 클릭한 후 서버 응답을 기다리는 중인 상태입니다. 모든 입력 필드와 버튼이 비활성화됩니다.'
      }
    }
  }
};

// 2. Empty 상태 - 초기 상태 (빈 폼)
export const Empty: Story = {
  name: '📭 Empty',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  parameters: {
    docs: {
      description: {
        story: '사용자가 처음 로그인 페이지에 접근했을 때의 초기 상태입니다. 모든 필드가 비어있고 로그인 버튼은 비활성화 상태입니다.'
      }
    }
  }
};

// 3. Error 상태 - 로그인 실패
export const Error: Story = {
  name: '❌ Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'Invalid email or password. Please check your credentials and try again.',
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  parameters: {
    docs: {
      description: {
        story: '잘못된 인증 정보로 로그인을 시도했을 때 표시되는 에러 상태입니다. 사용자 친화적인 에러 메시지를 표시합니다.'
      }
    }
  }
};

// OK 상태 - 정상적인 입력 상태
export const ValidForm: Story = {
  name: '✅ Valid Form',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  play: async ({ canvas }) => {
    // 폼에 유효한 데이터 입력
    const emailInput = (canvas as any).querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = (canvas as any).querySelector('input[type="password"]') as HTMLInputElement;
    
    if (emailInput && passwordInput) {
      emailInput.value = 'user@woodie.com';
      passwordInput.value = 'password123';
      
      // 이벤트 발생시켜 검증 트리거
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '유효한 이메일과 비밀번호가 입력되어 로그인 버튼이 활성화된 상태입니다. 이때 사용자는 로그인을 진행할 수 있습니다.'
      }
    }
  }
};

// 이메일 형식 검증 에러
export const EmailValidationError: Story = {
  name: '❌ Email Validation Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  play: async ({ canvas }) => {
    const emailInput = (canvas as any).querySelector('input[type="email"]') as HTMLInputElement;
    
    if (emailInput) {
      emailInput.value = 'invalid-email';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '잘못된 이메일 형식을 입력했을 때 실시간으로 표시되는 검증 에러입니다. 도메인 규칙이 UI 레벨에서 적용됩니다.'
      }
    }
  }
};

// 비밀번호 길이 검증 에러
export const PasswordValidationError: Story = {
  name: '❌ Password Too Short',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  play: async ({ canvas }) => {
    const emailInput = (canvas as any).querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = (canvas as any).querySelector('input[type="password"]') as HTMLInputElement;
    
    if (emailInput && passwordInput) {
      emailInput.value = 'user@woodie.com';
      passwordInput.value = '123'; // 너무 짧은 비밀번호
      
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '비밀번호가 최소 길이 요구사항(6자)을 충족하지 않을 때의 검증 에러입니다.'
      }
    }
  }
};

// 네트워크 에러 상태
export const NetworkError: Story = {
  name: '❌ Network Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'Unable to connect to the server. Please check your internet connection and try again.',
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  parameters: {
    docs: {
      description: {
        story: '네트워크 연결 문제로 인한 로그인 실패 상태입니다. 사용자에게 구체적인 해결 방법을 안내합니다.'
      }
    }
  }
};

// 서버 에러 상태
export const ServerError: Story = {
  name: '❌ Server Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'Server is temporarily unavailable. Our team has been notified. Please try again in a few minutes.',
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  parameters: {
    docs: {
      description: {
        story: '서버 내부 오류로 인한 로그인 실패 상태입니다. 사용자에게 임시적인 문제임을 안내합니다.'
      }
    }
  }
};

// 기억하기 체크된 상태
export const RememberMeChecked: Story = {
  name: '✅ Remember Me Enabled',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  play: async ({ canvas }) => {
    const rememberCheckbox = (canvas as any).querySelector('input[type="checkbox"]') as HTMLInputElement;
    
    if (rememberCheckbox) {
      rememberCheckbox.click();
    }
  },
  parameters: {
    docs: {
      description: {
        story: '"로그인 상태 유지" 옵션이 활성화된 상태입니다. 사용자의 편의성을 위한 기능입니다.'
      }
    }
  }
};

// Feature Flag가 비활성화된 상태 (회원가입/비밀번호 재설정 링크 없음)
export const FeaturesDisabled: Story = {
  name: '🔒 Features Disabled',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    // Feature Flag로 제어되는 기능들을 undefined로 설정
    onForgotPassword: undefined,
    onSignUpRedirect: undefined
  },
  parameters: {
    docs: {
      description: {
        story: 'Feature Flag에 의해 회원가입과 비밀번호 재설정 기능이 비활성화된 상태입니다. 로그인 기능만 사용 가능합니다.'
      }
    }
  }
};

// 긴 에러 메시지
export const LongErrorMessage: Story = {
  name: '❌ Long Error Message',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'Your account has been temporarily locked due to multiple failed login attempts. For security reasons, please wait 30 minutes before trying again or use the password reset option to regain access to your account immediately. If you believe this is an error, please contact our support team at support@woodie.com.',
    onForgotPassword: fn(),
    onSignUpRedirect: fn()
  },
  parameters: {
    docs: {
      description: {
        story: '긴 에러 메시지가 표시될 때의 UI 처리를 확인할 수 있습니다. 메시지가 적절히 래핑되어 표시됩니다.'
      }
    }
  }
};