import type { Meta, StoryObj } from '@storybook/react';
import { ProfileDetail } from './ProfileDetail';
import { ProfileDto } from '../../types/auth';
// import { ProfileUIState } from '../../types/auth'; // Unused import

const meta: Meta<typeof ProfileDetail> = {
  title: 'Auth/ProfileDetail',
  component: ProfileDetail,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ProfileDetail** - GetProfileUseCase에 대응하는 프로필 상세 보기 컴포넌트

이 컴포넌트는 Clean Architecture와 DDD 원칙을 준수하여:
- DTO-First: ProfileDto를 직접 사용하여 Application Layer와 일관성 유지
- Feature Flag: profileUpdate 기능으로 편집 버튼 제어
- 4가지 UI 상태 지원: Loading, Empty, Error, OK
        `
      }
    }
  },
  argTypes: {
    state: {
      control: false,
      description: 'UI 상태 (Loading, Error, Empty, OK)'
    },
    profile: {
      control: false,
      description: 'ProfileDto - Application Layer의 DTO 타입'
    },
    canEdit: {
      control: 'boolean',
      description: '편집 권한 여부'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ProfileDetail>;

// Mock 프로필 데이터 - Domain Entity 구조 반영
const mockProfile: ProfileDto = {
  id: 'profile-1',
  email: 'student@woodie.com',
  fullName: '김우디',
  displayName: '김우디',
  initials: 'KW',
  role: 'student',
  schoolId: 'school-1',
  gradeLevel: 9,
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  hasAvatar: true,
  settings: {
    theme: 'light',
    language: 'ko',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      showEmail: true,
      showActivity: true
    }
  },
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-20T12:30:00.000Z'
};

// 1. Loading 상태 - 스켈레톤 UI 표시
export const Loading: Story = {
  name: '📡 Loading',
  args: {
    profile: null,
    state: {
      profile: null,
      isLoading: true,
      error: null
    },
    canEdit: false
  },
  parameters: {
    docs: {
      description: {
        story: '프로필 데이터를 로딩하는 중일 때의 스켈레톤 UI입니다. 사용자 경험을 위해 애니메이션이 적용됩니다.'
      }
    }
  }
};

// 2. Empty 상태 - 프로필 정보 없음
export const Empty: Story = {
  name: '📭 Empty',
  args: {
    profile: null,
    state: {
      profile: null,
      isLoading: false,
      error: null
    },
    canEdit: false
  },
  parameters: {
    docs: {
      description: {
        story: '프로필 정보가 없을 때 표시되는 상태입니다. 사용자에게 명확한 안내 메시지를 제공합니다.'
      }
    }
  }
};

// 3. Error 상태 - 에러 발생시
export const Error: Story = {
  name: '❌ Error',
  args: {
    profile: null,
    state: {
      profile: null,
      isLoading: false,
      error: 'Failed to load profile. Please check your network connection and try again.'
    },
    canEdit: false
  },
  parameters: {
    docs: {
      description: {
        story: '프로필 로딩 중 에러가 발생했을 때의 상태입니다. 사용자 친화적인 에러 메시지를 표시합니다.'
      }
    }
  }
};

// 4. OK 상태 - 정상적인 프로필 표시 (학생)
export const Student: Story = {
  name: '✅ Student Profile',
  args: {
    profile: mockProfile,
    state: {
      profile: mockProfile,
      isLoading: false,
      error: null
    },
    canEdit: false
  },
  parameters: {
    docs: {
      description: {
        story: '학생 프로필의 정상적인 표시 상태입니다. 학생 역할에 특화된 정보(학년)가 포함됩니다.'
      }
    }
  }
};

// OK 상태 - 교사 프로필
export const Teacher: Story = {
  name: '✅ Teacher Profile',
  args: {
    profile: {
      ...mockProfile,
      fullName: '박선생',
      displayName: '박선생',
      initials: 'PS',
      role: 'teacher',
      gradeLevel: undefined,
      email: 'teacher@woodie.com'
    },
    state: {
      profile: {
        ...mockProfile,
        fullName: '박선생',
        displayName: '박선생',
        role: 'teacher',
        gradeLevel: undefined
      },
      isLoading: false,
      error: null
    },
    canEdit: true
  },
  parameters: {
    docs: {
      description: {
        story: '교사 프로필 표시 상태입니다. 학년 정보가 없고, 편집 권한이 있는 상태를 보여줍니다.'
      }
    }
  }
};

// OK 상태 - 관리자 프로필 (편집 가능)
export const AdminWithEdit: Story = {
  name: '✅ Admin Profile (Editable)',
  args: {
    profile: {
      ...mockProfile,
      fullName: '시스템 관리자',
      displayName: '시스템 관리자',
      initials: 'SA',
      role: 'admin',
      gradeLevel: undefined,
      email: 'admin@woodie.com',
      avatarUrl: undefined,
      hasAvatar: false
    },
    state: {
      profile: {
        ...mockProfile,
        fullName: '시스템 관리자',
        displayName: '시스템 관리자',
        role: 'admin',
        gradeLevel: undefined,
        hasAvatar: false
      },
      isLoading: false,
      error: null
    },
    canEdit: true,
    onEdit: () => alert('편집 모드로 전환합니다!')
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 프로필로 편집 권한이 있는 상태입니다. 프로필 사진이 없을 때 이니셜이 표시됩니다.'
      }
    }
  }
};

// 알림 설정이 모두 꺼진 상태
export const NotificationsDisabled: Story = {
  name: '✅ Notifications Disabled',
  args: {
    profile: {
      ...mockProfile,
      settings: {
        ...mockProfile.settings,
        notifications: {
          email: false,
          push: false,
          sms: false
        }
      }
    },
    state: {
      profile: {
        ...mockProfile,
        settings: {
          ...mockProfile.settings,
          notifications: {
            email: false,
            push: false,
            sms: false
          }
        }
      },
      isLoading: false,
      error: null
    },
    canEdit: true
  },
  parameters: {
    docs: {
      description: {
        story: '모든 알림이 비활성화된 사용자 프로필입니다. 설정 상태가 시각적으로 구분됩니다.'
      }
    }
  }
};

// 다크 테마 설정 상태
export const DarkTheme: Story = {
  name: '✅ Dark Theme User',
  args: {
    profile: {
      ...mockProfile,
      fullName: '김다크',
      displayName: '김다크',
      settings: {
        ...mockProfile.settings,
        theme: 'dark',
        language: 'en'
      }
    },
    state: {
      profile: {
        ...mockProfile,
        settings: {
          ...mockProfile.settings,
          theme: 'dark',
          language: 'en'
        }
      },
      isLoading: false,
      error: null
    },
    canEdit: false
  },
  parameters: {
    docs: {
      description: {
        story: '다크 테마와 영어 설정을 사용하는 사용자 프로필입니다.'
      }
    }
  }
};

// 긴 에러 메시지 상태
export const LongError: Story = {
  name: '❌ Long Error Message',
  args: {
    profile: null,
    state: {
      profile: null,
      isLoading: false,
      error: 'Failed to load user profile due to server connection timeout. This might be caused by network connectivity issues, server maintenance, or temporary service disruption. Please check your internet connection and try again in a few minutes. If the problem persists, please contact our support team for assistance.'
    },
    canEdit: false
  },
  parameters: {
    docs: {
      description: {
        story: '긴 에러 메시지가 표시될 때의 UI 처리를 확인할 수 있습니다.'
      }
    }
  }
};