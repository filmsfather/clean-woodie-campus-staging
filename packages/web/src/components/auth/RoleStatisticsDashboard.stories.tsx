import type { Meta, StoryObj } from '@storybook/react';
import { RoleStatisticsDashboard } from './RoleStatisticsDashboard';
import { RoleStatistics } from '../../types/auth';

const meta: Meta<typeof RoleStatisticsDashboard> = {
  title: 'Auth/RoleStatisticsDashboard',
  component: RoleStatisticsDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**RoleStatisticsDashboard** - GetRoleStatisticsUseCase에 대응하는 대시보드 컴포넌트

DDD 원칙 준수:
- Domain 지식을 UI에 반영: 각 역할별 통계 의미와 비즈니스 규칙을 UI에서 표현
- Aggregate 단위의 데이터 표시: RoleStatistics는 완전한 통계 집계체
- 순수한 프레젠테이션 레이어: 계산 로직 없이 표시만 담당

**통계 정보:**
- 전체 사용자 수 및 역할별 분포
- 초대 현황 (활성/만료 초대)
- 비율과 퍼센티지 시각화
- 비즈니스 인사이트 제공

**4가지 UI 상태:**
- Loading: 통계 로딩 중 스켈레톤
- Empty: 통계 데이터 없음
- Error: 통계 로딩 실패
- OK: 정상적인 통계 대시보드
        `
      }
    }
  },
  argTypes: {
    statistics: {
      control: false,
      description: 'RoleStatistics - 역할별 통계 데이터'
    },
    isLoading: {
      control: 'boolean',
      description: '로딩 상태'
    },
    error: {
      control: 'text',
      description: '에러 메시지'
    }
  }
};

export default meta;
type Story = StoryObj<typeof RoleStatisticsDashboard>;

// Mock 통계 데이터
const mockStatistics: RoleStatistics = {
  totalUsers: 1247,
  students: 1089,
  teachers: 142,
  admins: 16,
  activeInvites: 23,
  expiredInvites: 8
};

// 작은 규모 학교의 통계
const smallSchoolStatistics: RoleStatistics = {
  totalUsers: 45,
  students: 38,
  teachers: 6,
  admins: 1,
  activeInvites: 3,
  expiredInvites: 2
};

// 대규모 시스템의 통계
const largeSystemStatistics: RoleStatistics = {
  totalUsers: 15420,
  students: 13856,
  teachers: 1456,
  admins: 108,
  activeInvites: 156,
  expiredInvites: 89
};

// 1. Loading 상태 - 스켈레톤 UI
export const Loading: Story = {
  name: '📡 Loading',
  args: {
    statistics: null,
    isLoading: true,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '통계 데이터를 로딩하는 중일 때의 스켈레톤 UI입니다. 6개의 통계 카드가 애니메이션과 함께 로딩 상태를 표시합니다.'
      }
    }
  }
};

// 2. Empty 상태 - 통계 데이터 없음
export const Empty: Story = {
  name: '📭 Empty',
  args: {
    statistics: null,
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '통계 데이터가 없을 때 표시되는 상태입니다. 시스템 초기 설정이나 데이터 마이그레이션 중에 나타날 수 있습니다.'
      }
    }
  }
};

// 3. Error 상태 - 통계 로딩 실패
export const Error: Story = {
  name: '❌ Error',
  args: {
    statistics: null,
    isLoading: false,
    error: 'Failed to load statistics data. Database connection timeout.'
  },
  parameters: {
    docs: {
      description: {
        story: '통계 데이터 로딩 중 에러가 발생했을 때의 상태입니다. 데이터베이스 연결 오류나 서버 문제를 사용자에게 알립니다.'
      }
    }
  }
};

// 4. OK 상태 - 정상적인 통계 표시 (중간 규모)
export const NormalStatistics: Story = {
  name: '✅ Normal Statistics',
  args: {
    statistics: mockStatistics,
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '중간 규모 교육기관의 정상적인 통계 데이터입니다. 각 역할별 분포와 초대 현황을 시각적으로 표시합니다.'
      }
    }
  }
};

// 소규모 학교 통계
export const SmallSchool: Story = {
  name: '✅ Small School',
  args: {
    statistics: smallSchoolStatistics,
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '소규모 학교의 통계입니다. 적은 수의 사용자로도 의미있는 통계와 인사이트를 제공합니다.'
      }
    }
  }
};

// 대규모 시스템 통계
export const LargeSystem: Story = {
  name: '✅ Large System',
  args: {
    statistics: largeSystemStatistics,
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '대규모 교육 플랫폼의 통계입니다. 큰 숫자도 가독성 있게 표시되며, 천 단위 구분자가 적용됩니다.'
      }
    }
  }
};

// 초대가 없는 상태
export const NoInvites: Story = {
  name: '✅ No Invites',
  args: {
    statistics: {
      ...mockStatistics,
      activeInvites: 0,
      expiredInvites: 0
    },
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '활성 초대와 만료된 초대가 모두 없는 상태입니다. 초대 관련 알림이 표시되지 않습니다.'
      }
    }
  }
};

// 많은 만료 초대가 있는 상태
export const ManyExpiredInvites: Story = {
  name: '✅ Many Expired Invites',
  args: {
    statistics: {
      ...mockStatistics,
      activeInvites: 15,
      expiredInvites: 67
    },
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '만료된 초대가 많은 상태입니다. 시스템 정리가 필요하다는 인사이트가 표시됩니다.'
      }
    }
  }
};

// 많은 활성 초대가 있는 상태
export const ManyActiveInvites: Story = {
  name: '✅ Many Active Invites',
  args: {
    statistics: {
      ...mockStatistics,
      activeInvites: 45,
      expiredInvites: 3
    },
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '대기중인 초대가 많은 상태입니다. 리마인더 발송을 권장하는 인사이트가 표시됩니다.'
      }
    }
  }
};

// 관리자가 많은 비정상적인 상태
export const TooManyAdmins: Story = {
  name: '⚠️ Too Many Admins',
  args: {
    statistics: {
      totalUsers: 500,
      students: 350,
      teachers: 100,
      admins: 50, // 비정상적으로 많은 관리자
      activeInvites: 10,
      expiredInvites: 5
    },
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 비율이 비정상적으로 높은 상태입니다. 보안상 검토가 필요할 수 있음을 시사합니다.'
      }
    }
  }
};

// 학생 비율이 매우 높은 상태
export const StudentDominant: Story = {
  name: '✅ Student Dominant',
  args: {
    statistics: {
      totalUsers: 2000,
      students: 1890,
      teachers: 105,
      admins: 5,
      activeInvites: 25,
      expiredInvites: 12
    },
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '학생 비율이 매우 높은 일반적인 교육기관의 통계입니다. 건강한 사용자 구성을 보여줍니다.'
      }
    }
  }
};

// 신규 시스템 (사용자 수 적음)
export const NewSystem: Story = {
  name: '✅ New System',
  args: {
    statistics: {
      totalUsers: 5,
      students: 2,
      teachers: 2,
      admins: 1,
      activeInvites: 15,
      expiredInvites: 0
    },
    isLoading: false,
    error: null
  },
  parameters: {
    docs: {
      description: {
        story: '새로 구축된 시스템의 통계입니다. 활성 초대가 기존 사용자보다 많아 성장 중임을 보여줍니다.'
      }
    }
  }
};

// 네트워크 타임아웃 에러
export const NetworkTimeout: Story = {
  name: '❌ Network Timeout',
  args: {
    statistics: null,
    isLoading: false,
    error: 'Request timeout. The server took too long to respond. Please try again.'
  },
  parameters: {
    docs: {
      description: {
        story: '네트워크 타임아웃으로 인한 에러 상태입니다. 사용자에게 재시도를 권장하는 메시지를 표시합니다.'
      }
    }
  }
};

// 권한 없음 에러
export const AccessDenied: Story = {
  name: '❌ Access Denied',
  args: {
    statistics: null,
    isLoading: false,
    error: 'Access denied. You do not have permission to view system statistics.'
  },
  parameters: {
    docs: {
      description: {
        story: '통계 조회 권한이 없을 때의 에러 상태입니다. Feature Flag와 함께 권한 체계를 구현할 때 사용됩니다.'
      }
    }
  }
};