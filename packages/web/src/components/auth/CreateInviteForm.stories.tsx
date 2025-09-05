import type { Meta, StoryObj } from '@storybook/react';
// import { fn } from '@storybook/test'; // Unused import
import { CreateInviteForm } from './CreateInviteForm';
import { AuthActionResult } from '../../types/auth';

const meta: Meta<typeof CreateInviteForm> = {
  title: 'Auth/CreateInviteForm',
  component: CreateInviteForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**CreateInviteForm** - CreateInviteUseCase에 대응하는 초대 생성 폼

DDD 원칙 준수:
- 도메인 규칙을 UI 검증에 반영: 이메일 형식, 학생 역할시 클래스 필수 등
- Aggregate 완전성: CreateInviteDto의 모든 필수 필드 수집
- 비즈니스 규칙: 만료일 범위, 역할별 제약사항 등을 UI에서 강제
- Feature Flag: inviteCreation으로 전체 기능 제어

**도메인 규칙:**
- 이메일 형식 검증
- 학생 역할시 클래스 필수 선택
- 만료일 1-30일 제한
- 조직별 중복 초대 방지

**4가지 UI 상태:**
- Loading: 초대 생성 처리 중
- Empty: 초기 빈 폼 상태
- Error: 초대 생성 실패
- OK: 정상적인 입력 및 제출 가능 상태
        `
      }
    }
  },
  argTypes: {
    onSubmit: {
      action: 'invite-submitted',
      description: 'CreateInviteUseCase 호출 함수'
    },
    isLoading: {
      control: 'boolean',
      description: '초대 생성 처리 중 여부'
    },
    error: {
      control: 'text',
      description: '서버 에러 메시지'
    },
    organizationId: {
      control: 'text',
      description: '조직 ID'
    },
    createdBy: {
      control: 'text',
      description: '초대 생성자 ID'
    },
    availableClasses: {
      control: false,
      description: '선택 가능한 클래스 목록'
    }
  }
};

export default meta;
type Story = StoryObj<typeof CreateInviteForm>;

// Mock 함수와 데이터
const mockSubmit = async (formData: any): Promise<AuthActionResult> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (formData.email === 'duplicate@test.com') {
    return { 
      success: false, 
      message: 'An active invite already exists for this email in this organization' 
    };
  }
  return { 
    success: true, 
    message: 'Invite sent successfully', 
    data: { inviteId: 'invite-123', token: 'mock-token' } 
  };
};

const mockClasses = [
  { id: 'class-1', name: '중학교 1학년 A반' },
  { id: 'class-2', name: '중학교 1학년 B반' },
  { id: 'class-3', name: '중학교 2학년 A반' },
  { id: 'class-4', name: '중학교 2학년 B반' }
];

// 1. Loading 상태 - 초대 생성 처리 중
export const Loading: Story = {
  name: '📡 Loading',
  args: {
    onSubmit: mockSubmit,
    isLoading: true,
    error: null,
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  parameters: {
    docs: {
      description: {
        story: '초대 생성 버튼을 클릭한 후 서버에서 처리 중일 때의 상태입니다. 모든 입력 필드와 버튼이 비활성화됩니다.'
      }
    }
  }
};

// 2. Empty 상태 - 초기 빈 폼
export const Empty: Story = {
  name: '📭 Empty',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  parameters: {
    docs: {
      description: {
        story: '초대 생성 폼의 초기 상태입니다. 기본값으로 학생 역할과 7일 만료 기간이 설정되어 있습니다.'
      }
    }
  }
};

// 3. Error 상태 - 초대 생성 실패
export const Error: Story = {
  name: '❌ Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'Failed to create invite. An active invite already exists for this email.',
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  parameters: {
    docs: {
      description: {
        story: '중복된 이메일로 초대를 생성하려고 할 때의 에러 상태입니다. 도메인 규칙 위반을 사용자에게 알립니다.'
      }
    }
  }
};

// 4. OK 상태 - 학생 초대 (클래스 선택 포함)
export const StudentInvite: Story = {
  name: '✅ Student Invite',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    const roleSelect = canvas.querySelector('select') as HTMLSelectElement;
    
    if (emailInput && roleSelect) {
      emailInput.value = 'newstudent@woodie.com';
      roleSelect.value = 'student';
      
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      roleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '학생 초대를 생성하는 정상 상태입니다. 학생 역할 선택시 클래스 선택 드롭다운이 표시됩니다.'
      }
    }
  }
};

// 교사 초대 (클래스 선택 없음)
export const TeacherInvite: Story = {
  name: '✅ Teacher Invite',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'admin-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    const selects = canvas.querySelectorAll('select');
    const roleSelect = selects[0]; // 첫 번째 select는 역할 선택
    
    if (emailInput && roleSelect) {
      emailInput.value = 'newteacher@woodie.com';
      roleSelect.value = 'teacher';
      
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      roleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '교사 초대 생성 상태입니다. 교사 역할 선택시 클래스 선택이 필요하지 않습니다.'
      }
    }
  }
};

// 관리자 초대
export const AdminInvite: Story = {
  name: '✅ Admin Invite',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'admin-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    const selects = canvas.querySelectorAll('select');
    const roleSelect = selects[0];
    
    if (emailInput && roleSelect) {
      emailInput.value = 'newadmin@woodie.com';
      roleSelect.value = 'admin';
      
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      roleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 초대 생성 상태입니다. 관리자는 시스템 전체 권한을 가지므로 특별한 주의가 필요합니다.'
      }
    }
  }
};

// 이메일 검증 에러
export const EmailValidationError: Story = {
  name: '❌ Email Validation Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    
    if (emailInput) {
      emailInput.value = 'invalid-email-format';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '잘못된 이메일 형식 입력시 나타나는 실시간 검증 에러입니다. 도메인 규칙이 UI에서 강제됩니다.'
      }
    }
  }
};

// 만료일 검증 에러
export const ExpiryValidationError: Story = {
  name: '❌ Expiry Days Validation Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    const expiryInput = canvas.querySelector('input[type="number"]') as HTMLInputElement;
    
    if (emailInput && expiryInput) {
      emailInput.value = 'student@woodie.com';
      expiryInput.value = '45'; // 30일 초과
      
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      expiryInput.dispatchEvent(new Event('input', { bubbles: true }));
      expiryInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '만료일이 허용 범위(1-30일)를 벗어날 때의 검증 에러입니다. 비즈니스 규칙을 UI에서 강제합니다.'
      }
    }
  }
};

// 클래스가 없는 환경
export const NoAvailableClasses: Story = {
  name: '✅ No Available Classes',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'admin-1',
    availableClasses: [] // 빈 배열
  },
  parameters: {
    docs: {
      description: {
        story: '사용 가능한 클래스가 없는 환경입니다. 학생 초대시 클래스 선택 필드가 표시되지 않습니다.'
      }
    }
  }
};

// 긴 만료 기간 설정
export const LongExpiryPeriod: Story = {
  name: '✅ Long Expiry Period',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: null,
    organizationId: 'org-1',
    createdBy: 'admin-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    const expiryInput = canvas.querySelector('input[type="number"]') as HTMLInputElement;
    
    if (emailInput && expiryInput) {
      emailInput.value = 'longterm@woodie.com';
      expiryInput.value = '30'; // 최대 기간
      
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      expiryInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '최대 만료 기간(30일)으로 설정된 초대입니다. 장기간 유효한 초대 링크를 생성할 때 사용합니다.'
      }
    }
  }
};

// 네트워크 에러
export const NetworkError: Story = {
  name: '❌ Network Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'Network connection failed. Please check your internet connection and try again.',
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  parameters: {
    docs: {
      description: {
        story: '네트워크 연결 문제로 인한 초대 생성 실패 상태입니다. 사용자에게 구체적인 해결 방법을 안내합니다.'
      }
    }
  }
};

// 중복 초대 에러
export const DuplicateInviteError: Story = {
  name: '❌ Duplicate Invite Error',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'An active invite already exists for this email in this organization. Please check existing invites or use a different email address.',
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    
    if (emailInput) {
      emailInput.value = 'duplicate@test.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: '이미 활성 초대가 있는 이메일로 재초대를 시도할 때의 도메인 규칙 위반 에러입니다.'
      }
    }
  }
};

// 권한 부족 에러
export const InsufficientPermissions: Story = {
  name: '❌ Insufficient Permissions',
  args: {
    onSubmit: mockSubmit,
    isLoading: false,
    error: 'You do not have permission to create admin invites. Please contact your administrator.',
    organizationId: 'org-1',
    createdBy: 'teacher-1',
    availableClasses: mockClasses
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 초대 생성 권한이 없는 사용자가 시도할 때의 에러 상태입니다. 권한 체계를 명확히 안내합니다.'
      }
    }
  }
};