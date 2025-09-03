/**
 * SignInUseCase 기반 Storybook 스토리
 * L/Empty/Error/OK 4가지 상태를 모두 다루는 UseCase-First 접근
 */
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { SignInPage } from './SignInPage';
import { AuthContext } from '../../contexts/AuthContext';

const mockAuthContext = {
  user: null,
  loading: false,
  signIn: async (data: any) => {
    console.log('SignIn attempt:', data);
    return Promise.resolve();
  },
  signOut: async () => {},
  signUp: async () => {},
};

const meta: Meta<typeof SignInPage> = {
  title: 'Auth/SignIn/SignInUseCase',
  component: SignInPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# SignInUseCase UI 표면

**UseCase → UI 매핑**: \`SignInUseCase\` → \`SignInPage\`

## 4가지 상태 스토리
- **Loading**: 로그인 시도 중 상태 (버튼 disabled, 로딩 스피너)
- **Empty**: 초기 빈 폼 상태 (입력 필드 비어있음)
- **Error**: 로그인 실패 상태 (에러 메시지 표시)
- **OK**: 성공적인 로그인 상태 (리다이렉션)

## Application DTO 기반
폼 상태는 \`SignInRequest\` DTO를 직접 사용 (DTO-First 원칙)

\`\`\`typescript
interface SignInRequest {
  email: string;
  password: string;
  context?: AuthContext;
}
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <Story />
        </AuthContext.Provider>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🔄 Loading State
 * 사용자가 로그인 버튼을 클릭한 후 SignInUseCase 실행 중
 * 버튼 disabled, 로딩 상태 표시
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/signin', () => {
          return new Promise(() => {}); // 무한 로딩
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // 폼 자동 입력 후 제출하여 로딩 상태 시뮬레이션
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = canvas.querySelector('input[name="password"]') as HTMLInputElement;
    const submitButton = canvas.querySelector('button[type="submit"]') as HTMLButtonElement;

    if (emailInput && passwordInput && submitButton) {
      emailInput.value = 'test@example.com';
      passwordInput.value = 'password123';
      
      // 약간의 지연 후 제출
      setTimeout(() => {
        submitButton.click();
      }, 100);
    }
  },
};

/**
 * 📭 Empty State
 * 초기 로그인 폼 상태
 * 모든 필드가 비어있고 제출 버튼 비활성화
 */
export const Empty: Story = {};

/**
 * ❌ Error State
 * 잘못된 자격증명으로 로그인 시도 시
 * 에러 메시지 표시
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/signin', () => {
          return HttpResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }),
      ],
    },
  },
};

/**
 * ✅ OK State
 * 유효한 자격증명으로 로그인 성공
 * 대시보드로 리다이렉션
 */
export const OK: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/signin', () => {
          return HttpResponse.json({
            user: {
              id: 'user-1',
              email: 'student@example.com',
              name: '김학생',
              role: 'student',
            },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          });
        }),
      ],
    },
  },
};

/**
 * 🎯 Feature Flags Test
 * signIn Feature Flag가 비활성화된 경우
 */
export const FeatureDisabled: Story = {
  // TODO: Feature Flag override 구현
  parameters: {
    docs: {
      description: {
        story: 'signIn Feature Flag가 비활성화되어 컴포넌트가 렌더링되지 않는 상태',
      },
    },
  },
};

/**
 * 📱 Responsive Test
 * 모바일 뷰포트에서의 로그인 폼
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};