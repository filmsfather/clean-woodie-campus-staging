import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { UserDirectory } from './UserDirectory';
import { ProfileDto, UserListFilter } from '../../types/auth';

const meta: Meta<typeof UserDirectory> = {
  title: 'Auth/UserDirectory',
  component: UserDirectory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**UserDirectory** - FindProfilesByRoleUseCase, FindProfilesBySchoolUseCase, FindStudentsByGradeUseCase 통합

여러 Query UseCase를 통합한 사용자 디렉토리 컴포넌트입니다.

Clean Architecture & DDD 원칙 준수:
- 여러 UseCase의 결과를 하나의 UI로 통합
- Feature Flag로 각 기능(검색, 역할별 필터링, 학년별 필터링 등)의 노출 제어
- DTO-First: ProfileDto를 직접 사용
- 페이지네이션과 필터링으로 대량 데이터 처리

**4가지 UI 상태:**
- Loading: 데이터 로딩 중 스켈레톤
- Empty: 검색 결과 없음
- Error: 데이터 로딩 실패
- OK: 정상적인 사용자 목록 표시
        `
      }
    }
  },
  argTypes: {
    users: {
      control: false,
      description: 'ProfileDto 배열'
    },
    filter: {
      control: false,
      description: '현재 적용된 필터'
    },
    onFilterChange: {
      action: 'filter-changed',
      description: '필터 변경 핸들러'
    },
    onUserSelect: {
      action: 'user-selected',
      description: '사용자 선택 핸들러'
    },
    onRoleChange: {
      action: 'role-changed',
      description: '역할 변경 핸들러'
    },
    canManageRoles: {
      control: 'boolean',
      description: '역할 관리 권한'
    }
  }
};

export default meta;
type Story = StoryObj<typeof UserDirectory>;

// Mock 데이터
const mockUsers: ProfileDto[] = [
  {
    id: 'student-1',
    email: 'student1@woodie.com',
    fullName: '김학생',
    displayName: '김학생',
    initials: 'KS',
    role: 'student',
    schoolId: 'school-1',
    gradeLevel: 9,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    hasAvatar: true,
    settings: {
      theme: 'light',
      language: 'ko',
      notifications: { email: true, push: true, sms: false },
      privacy: { showEmail: true, showActivity: true }
    },
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-20T12:30:00.000Z'
  },
  {
    id: 'student-2',
    email: 'student2@woodie.com',
    fullName: '이학생',
    displayName: '이학생',
    initials: 'LS',
    role: 'student',
    schoolId: 'school-1',
    gradeLevel: 10,
    hasAvatar: false,
    settings: {
      theme: 'dark',
      language: 'ko',
      notifications: { email: false, push: true, sms: false },
      privacy: { showEmail: false, showActivity: true }
    },
    createdAt: '2024-01-16T00:00:00.000Z',
    updatedAt: '2024-01-21T09:15:00.000Z'
  },
  {
    id: 'teacher-1',
    email: 'teacher1@woodie.com',
    fullName: '박선생',
    displayName: '박선생',
    initials: 'PS',
    role: 'teacher',
    schoolId: 'school-1',
    hasAvatar: false,
    settings: {
      theme: 'light',
      language: 'ko',
      notifications: { email: true, push: true, sms: true },
      privacy: { showEmail: true, showActivity: true }
    },
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-25T14:20:00.000Z'
  },
  {
    id: 'admin-1',
    email: 'admin@woodie.com',
    fullName: '관리자',
    displayName: '관리자',
    initials: 'AD',
    role: 'admin',
    schoolId: 'school-1',
    hasAvatar: false,
    settings: {
      theme: 'auto',
      language: 'ko',
      notifications: { email: true, push: true, sms: false },
      privacy: { showEmail: false, showActivity: false }
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-28T16:45:00.000Z'
  }
];

const defaultFilter: UserListFilter = {
  page: 1,
  limit: 10
};

// 1. Loading 상태 - 스켈레톤 UI
export const Loading: Story = {
  name: '📡 Loading',
  args: {
    users: [],
    totalCount: 0,
    isLoading: true,
    error: null,
    filter: defaultFilter,
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '사용자 목록을 로딩하는 중일 때의 스켈레톤 UI입니다. 여러 개의 사용자 카드가 애니메이션과 함께 표시됩니다.'
      }
    }
  }
};

// 2. Empty 상태 - 검색 결과 없음
export const Empty: Story = {
  name: '📭 Empty',
  args: {
    users: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    filter: { ...defaultFilter, search: 'nonexistent' },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '검색 조건에 맞는 사용자가 없을 때 표시되는 상태입니다. 사용자에게 다른 검색어를 시도하도록 안내합니다.'
      }
    }
  }
};

// 3. Error 상태 - 데이터 로딩 실패
export const Error: Story = {
  name: '❌ Error',
  args: {
    users: [],
    totalCount: 0,
    isLoading: false,
    error: 'Failed to load users. Please check your connection and try again.',
    filter: defaultFilter,
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '사용자 목록 로딩 중 에러가 발생했을 때의 상태입니다. 사용자에게 구체적인 해결 방법을 제시합니다.'
      }
    }
  }
};

// 4. OK 상태 - 전체 사용자 목록
export const AllUsers: Story = {
  name: '✅ All Users',
  args: {
    users: mockUsers,
    totalCount: mockUsers.length,
    isLoading: false,
    error: null,
    filter: defaultFilter,
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '모든 사용자가 표시되는 정상 상태입니다. 각 사용자의 역할과 기본 정보가 카드 형태로 표시됩니다.'
      }
    }
  }
};

// 학생만 필터링된 상태
export const StudentsOnly: Story = {
  name: '✅ Students Only',
  args: {
    users: mockUsers.filter(u => u.role === 'student'),
    totalCount: mockUsers.filter(u => u.role === 'student').length,
    isLoading: false,
    error: null,
    filter: { ...defaultFilter, role: 'student' },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '학생 역할로 필터링된 사용자 목록입니다. FindProfilesByRoleUseCase의 결과를 보여줍니다.'
      }
    }
  }
};

// 교사만 필터링된 상태
export const TeachersOnly: Story = {
  name: '✅ Teachers Only',
  args: {
    users: mockUsers.filter(u => u.role === 'teacher'),
    totalCount: mockUsers.filter(u => u.role === 'teacher').length,
    isLoading: false,
    error: null,
    filter: { ...defaultFilter, role: 'teacher' },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '교사 역할로 필터링된 사용자 목록입니다. 교사는 학년 정보가 표시되지 않습니다.'
      }
    }
  }
};

// 역할 관리 권한이 있는 상태
export const WithRoleManagement: Story = {
  name: '✅ Role Management Enabled',
  args: {
    users: mockUsers,
    totalCount: mockUsers.length,
    isLoading: false,
    error: null,
    filter: defaultFilter,
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: true
  },
  parameters: {
    docs: {
      description: {
        story: '역할 관리 권한이 있는 관리자가 보는 화면입니다. 각 사용자의 역할을 변경할 수 있는 드롭다운이 표시됩니다.'
      }
    }
  }
};

// 9학년 학생만 필터링 (FindStudentsByGradeUseCase)
export const Grade9Students: Story = {
  name: '✅ Grade 9 Students',
  args: {
    users: mockUsers.filter(u => u.role === 'student' && u.gradeLevel === 9),
    totalCount: mockUsers.filter(u => u.role === 'student' && u.gradeLevel === 9).length,
    isLoading: false,
    error: null,
    filter: { ...defaultFilter, role: 'student', gradeLevel: 9 },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '9학년 학생만 필터링된 목록입니다. FindStudentsByGradeUseCase의 결과를 보여줍니다.'
      }
    }
  }
};

// 검색 결과가 있는 상태
export const SearchResults: Story = {
  name: '✅ Search Results',
  args: {
    users: mockUsers.filter(u => u.fullName.includes('김')),
    totalCount: mockUsers.filter(u => u.fullName.includes('김')).length,
    isLoading: false,
    error: null,
    filter: { ...defaultFilter, search: '김' },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '"김"으로 검색했을 때의 결과입니다. 실시간 검색 기능이 적용되어 입력과 동시에 필터링됩니다.'
      }
    }
  }
};

// 페이지네이션이 필요한 대량 데이터
export const LargeDataset: Story = {
  name: '✅ Large Dataset with Pagination',
  args: {
    users: mockUsers,
    totalCount: 250, // 실제로는 더 많은 사용자가 있음을 가정
    isLoading: false,
    error: null,
    filter: { ...defaultFilter, page: 2 },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '대량의 사용자 데이터가 있을 때 페이지네이션이 적용된 상태입니다. 현재 2페이지를 보고 있습니다.'
      }
    }
  }
};

// 복합 필터가 적용된 상태
export const MultipleFilters: Story = {
  name: '✅ Multiple Filters Applied',
  args: {
    users: mockUsers.filter(u => u.role === 'student' && u.gradeLevel === 10),
    totalCount: mockUsers.filter(u => u.role === 'student' && u.gradeLevel === 10).length,
    isLoading: false,
    error: null,
    filter: { 
      ...defaultFilter, 
      role: 'student', 
      gradeLevel: 10,
      schoolId: 'school-1',
      search: ''
    },
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: true
  },
  parameters: {
    docs: {
      description: {
        story: '역할, 학년, 학교 필터가 모두 적용된 복합 필터링 상태입니다. 여러 UseCase의 조건을 동시에 적용할 수 있습니다.'
      }
    }
  }
};

// 긴 이름과 이메일을 가진 사용자들
export const LongNamesAndEmails: Story = {
  name: '✅ Long Names and Emails',
  args: {
    users: [
      {
        ...mockUsers[0],
        fullName: '김매우긴이름을가진학생입니다',
        displayName: '김매우긴이름을가진학생입니다',
        email: 'very.long.email.address.for.testing.ui.layout@woodiecampus.example.com',
        initials: 'KV'
      },
      {
        ...mockUsers[1],
        fullName: 'John Very Long English Name Student',
        displayName: 'John Very Long English Name Student',
        email: 'john.very.long.english.name.student@international.woodiecampus.co.kr',
        initials: 'JV'
      }
    ],
    totalCount: 2,
    isLoading: false,
    error: null,
    filter: defaultFilter,
    onFilterChange: fn(),
    onUserSelect: fn(),
    onRoleChange: fn(),
    canManageRoles: false
  },
  parameters: {
    docs: {
      description: {
        story: '긴 이름과 이메일 주소를 가진 사용자들의 UI 레이아웃 처리를 확인할 수 있습니다.'
      }
    }
  }
};