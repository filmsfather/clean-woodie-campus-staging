import type { UserRole } from '@woodie/domain';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: Array<UserRole | 'all'>;
  description?: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const mainNavigation: NavSection[] = [
  {
    section: '학습',
    items: [
      {
        label: '학생 대시보드',
        path: '/dashboard',
        icon: '📊',
        roles: ['student'],
        description: '학습 현황 및 통계'
      },
      {
        label: '관리자 대시보드',
        path: '/admin/dashboard',
        icon: '📊',
        roles: ['admin'],
        description: '시스템 관리 대시보드'
      },
      {
        label: '오늘의 학습',
        path: '/study/today',
        icon: '📅',
        roles: ['student'],
        description: '오늘 완료해야 할 학습 항목'
      },
      {
        label: '복습',
        path: '/study/review',
        icon: '🔄',
        roles: ['student'],
        description: 'SRS 기반 복습 문제'
      },
      {
        label: '문제 풀기',
        path: '/study/solve',
        icon: '✏️',
        roles: ['student'],
        description: '새로운 문제 학습'
      },
      {
        label: '내 성과',
        path: '/study/progress',
        icon: '📈',
        roles: ['student'],
        description: '학습 진도 및 성취도'
      }
    ]
  },
  {
    section: '교육 관리',
    items: [
      {
        label: '교사 대시보드',
        path: '/teacher/dashboard',
        icon: '📊',
        roles: ['teacher', 'admin'],
        description: '교사 대시보드 (관리자도 접근 가능)'
      },
      {
        label: '학생 관리',
        path: '/manage/students',
        icon: '👥',
        roles: ['teacher', 'admin'],
        description: '학생 현황 및 진도 관리'
      },
      {
        label: '문제집 관리',
        path: '/manage/problem-sets',
        icon: '📚',
        roles: ['teacher', 'admin'],
        description: '문제집 생성 및 배정'
      },
      {
        label: '문제 관리',
        path: '/manage/problems',
        icon: '📝',
        roles: ['teacher', 'admin'],
        description: '문제 생성 및 편집'
      },
      {
        label: '성적 분석',
        path: '/manage/analytics',
        icon: '📈',
        roles: ['teacher', 'admin'],
        description: '학생 성적 분석 및 리포트'
      }
    ]
  },
  {
    section: '시스템 관리',
    items: [
      {
        label: '사용자 관리',
        path: '/admin/users',
        icon: '👤',
        roles: ['admin'],
        description: '사용자 계정 관리'
      },
      {
        label: '반 관리',
        path: '/admin/classes',
        icon: '🏫',
        roles: ['admin'],
        description: '학급 및 반 관리'
      },
      {
        label: '콘텐츠 관리',
        path: '/admin/content',
        icon: '📝',
        roles: ['admin'],
        description: '문제 및 콘텐츠 관리'
      },
      {
        label: '시스템 통계',
        path: '/admin/analytics',
        icon: '📊',
        roles: ['admin'],
        description: '시스템 사용 현황'
      },
      {
        label: '설정',
        path: '/admin/system',
        icon: '⚙️',
        roles: ['admin'],
        description: '시스템 설정'
      }
    ]
  }
];

// 역할별 접근 권한 체크 함수
export const canAccessNavItem = (navItem: NavItem, userRole: UserRole | null): boolean => {
  if (!userRole) return false;
  
  if (navItem.roles.includes('all')) return true;
  if (navItem.roles.includes(userRole)) return true;
  
  // 관리자는 교사 권한도 가짐
  if (userRole === 'admin' && navItem.roles.includes('teacher')) return true;
  
  return false;
};

// URL에서 브레드크럼 생성
export const generateBreadcrumb = (pathname: string): Array<{ label: string; path: string }> => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [];
  
  // 홈 추가
  breadcrumbs.push({ label: '홈', path: '/' });
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // 경로에서 라벨 찾기
    const navItem = findNavItemByPath(currentPath);
    const label = navItem?.label || formatSegment(segment);
    
    breadcrumbs.push({ label, path: currentPath });
  });
  
  return breadcrumbs;
};

// 경로로 네비게이션 아이템 찾기
const findNavItemByPath = (path: string): NavItem | undefined => {
  for (const section of mainNavigation) {
    const item = section.items.find(item => item.path === path);
    if (item) return item;
  }
  return undefined;
};

// URL 세그먼트를 읽기 쉬운 라벨로 변환
const formatSegment = (segment: string): string => {
  const labelMap: Record<string, string> = {
    'dashboard': '대시보드',
    'study': '학습',
    'today': '오늘의 학습',
    'review': '복습',
    'solve': '문제 풀기',
    'progress': '진도',
    'manage': '관리',
    'students': '학생',
    'problems': '문제',
    'problem-sets': '문제집',
    'analytics': '분석',
    'admin': '관리자',
    'users': '사용자',
    'classes': '반관리',
    'system': '시스템'
  };
  
  return labelMap[segment] || segment;
};