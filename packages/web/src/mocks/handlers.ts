import { http, HttpResponse } from 'msw';
import type { 
  SignInRequest, SignInResponse,
  SignUpRequest, SignUpResponse,
  ProfileDto, UpdateProfileRequest,
  GetStudentDashboardResponse,
  GetTodayReviewsResponse, SubmitReviewFeedbackRequest,
  GetReviewStatisticsResponse,
  GetClassProgressResponse,
  StreakRankingDto,
  LeaderboardSummaryDto,
  RewardDto, RewardRedemptionDto
} from '@woodie/application';

// Problems UseCase 관련 타입들 
import type {
  ProblemDto, ProblemDetailDto, ProblemSearchRequestDto, ProblemSearchResponseDto,
  CreateProblemInput, CreateProblemOutput,
  UpdateProblemContentInput, UpdateProblemAnswerInput,
  ChangeProblemDifficultyInput, ManageProblemTagsInput,
  ActivateProblemInput, DeactivateProblemInput, DeleteProblemInput,
  CloneProblemInput, GetProblemListInput, GetProblemListOutput,
  ProblemOutput
} from '../types/problems';

// Auth UseCase 관련 타입들
import type {
  CreateInviteDto, InviteDto, UseInviteTokenDto,
  ValidateInviteTokenDto, InviteTokenValidationDto,
  CreateProfileDto, UpdateProfileFormState,
  ProfileListDto, ChangeRoleDto,
  RoleStatistics
} from '../types/auth';

/**
 * MSW 핸들러 - 모든 UseCase에 대한 현실적인 API 모킹
 * Storybook과 테스트에서 사용됩니다.
 */

// Mock 데이터 - Clean Architecture 원칙에 따라 Domain Entity 구조 모방

// Mock Problems 데이터
const mockProblems: ProblemDetailDto[] = [
  {
    id: '1',
    teacherId: 'teacher-1',
    title: '이차방정식의 해 구하기',
    description: '주어진 이차방정식 ax² + bx + c = 0에서 판별식을 이용하여 해의 개수와 해를 구하는 문제입니다.',
    type: 'multiple_choice',
    difficulty: 5,
    tags: ['수학', '대수', '이차방정식', '판별식'],
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    content: {
      type: 'multiple_choice',
      title: '이차방정식의 해 구하기',
      description: '주어진 이차방정식 ax² + bx + c = 0에서 판별식을 이용하여 해의 개수와 해를 구하는 문제입니다.',
      instructions: '다음 이차방정식 2x² - 5x + 2 = 0의 해를 구하시오.',
      choices: [
        '1) x = 1/2, x = 2',
        '2) x = 1, x = 3', 
        '3) x = -1/2, x = -2',
        '4) x = 2, x = 3',
        '5) 해가 없다'
      ]
    },
    correctAnswer: {
      type: 'multiple_choice',
      points: 10
    }
  },
  {
    id: '2',
    teacherId: 'teacher-1',
    title: '미적분 기본 정리',
    description: '미적분의 기본 정리를 적용하여 정적분을 계산하는 문제입니다.',
    type: 'short_answer',
    difficulty: 8,
    tags: ['수학', '미적분', '정적분'],
    isActive: false,
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    content: {
      type: 'short_answer',
      title: '미적분 기본 정리',
      description: '미적분의 기본 정리를 적용하여 정적분을 계산하는 문제입니다.',
      instructions: '다음 정적분 ∫[0→2] (3x² + 2x - 1) dx 의 값을 구하시오.',
      placeholder: '예: 10'
    },
    correctAnswer: {
      type: 'short_answer',
      points: 15
    }
  },
  {
    id: '3',
    teacherId: 'teacher-2',
    title: '물리 운동법칙',
    description: '뉴턴의 운동 법칙을 적용하여 물체의 운동을 분석하는 문제입니다.',
    type: 'essay',
    difficulty: 6,
    tags: ['물리', '운동', '뉴턴법칙'],
    isActive: true,
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-13T16:45:00Z',
    content: {
      type: 'essay',
      title: '물리 운동법칙',
      description: '뉴턴의 운동 법칙을 적용하여 물체의 운동을 분석하는 문제입니다.',
      instructions: '질량이 2kg인 물체에 10N의 힘이 작용할 때, 물체의 가속도와 3초 후 속도를 구하고 과정을 설명하시오.'
    },
    correctAnswer: {
      type: 'essay',
      points: 20
    }
  }
];
const mockUsers = {
  'student-1': {
    id: 'student-1',
    email: 'student1@test.com',
    name: '김학생',
    role: 'student' as const,
    profile: {
      id: 'profile-1',
      userId: 'student-1',
      fullName: '김학생',
      email: 'student1@test.com',
      phoneNumber: '010-1234-5678',
      dateOfBirth: '2005-03-15',
      grade: 9,
      school: '우디중학교',
      profileImageUrl: undefined,
      preferences: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        notificationEnabled: true,
        emailNotification: true,
        difficulty: 'medium'
      },
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    }
  },
  'student-2': {
    id: 'student-2',
    email: 'student2@test.com',
    name: '이학생',
    role: 'student' as const,
    profile: {
      id: 'profile-2',
      userId: 'student-2',
      fullName: '이학생',
      email: 'student2@test.com',
      phoneNumber: '010-2345-6789',
      dateOfBirth: '2005-07-22',
      grade: 9,
      school: '우디중학교',
      profileImageUrl: undefined,
      preferences: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        notificationEnabled: true,
        emailNotification: false,
        difficulty: 'hard'
      },
      createdAt: '2024-01-20T00:00:00.000Z',
      updatedAt: '2024-01-20T00:00:00.000Z'
    }
  },
  'teacher-1': {
    id: 'teacher-1',
    email: 'teacher@test.com',
    name: '박선생',
    role: 'teacher' as const,
    profile: {
      id: 'profile-3',
      userId: 'teacher-1',
      fullName: '박선생',
      email: 'teacher@test.com',
      phoneNumber: '010-3456-7890',
      dateOfBirth: '1985-04-10',
      grade: undefined,
      school: '우디중학교',
      profileImageUrl: undefined,
      preferences: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        notificationEnabled: true,
        emailNotification: true,
        difficulty: 'medium'
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  },
  'admin-1': {
    id: 'admin-1',
    email: 'admin@test.com',
    name: '관리자',
    role: 'admin' as const,
    profile: {
      id: 'profile-4',
      userId: 'admin-1',
      fullName: '관리자',
      email: 'admin@test.com',
      phoneNumber: '010-4567-8901',
      dateOfBirth: '1980-01-01',
      grade: undefined,
      school: '우디중학교',
      profileImageUrl: undefined,
      preferences: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        notificationEnabled: true,
        emailNotification: true,
        difficulty: 'medium'
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  }
};

// Mock 초대 데이터 - UseCase 테스트용
const mockInvites: InviteDto[] = [
  {
    id: 'invite-1',
    email: 'newstudent@test.com',
    role: 'student',
    organizationId: 'org-1',
    classId: 'class-1',
    token: 'mock-token-student-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'teacher-1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    isUsed: false,
    isValid: true
  },
  {
    id: 'invite-2',
    email: 'newteacher@test.com',
    role: 'teacher',
    organizationId: 'org-1',
    token: 'mock-token-teacher-1',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin-1',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    isUsed: false,
    isValid: true
  },
  {
    id: 'invite-3',
    email: 'expired@test.com',
    role: 'student',
    organizationId: 'org-1',
    classId: 'class-1',
    token: 'mock-token-expired-1',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'teacher-1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: true,
    isUsed: false,
    isValid: false
  },
  {
    id: 'invite-4',
    email: 'used@test.com',
    role: 'student',
    organizationId: 'org-1',
    classId: 'class-2',
    token: 'mock-token-used-1',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    usedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdBy: 'teacher-1',
    usedBy: 'student-3',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    isUsed: true,
    isValid: false
  }
];

// Auth UseCase 핸들러들 - Clean Architecture 원칙에 따라 각 UseCase별로 구분
export const authHandlers = [
  // SignInUseCase
  http.post('/api/auth/signin', async ({ request }) => {
    const body = await request.json() as SignInRequest;
    
    const user = Object.values(mockUsers).find(u => u.email === body.email);
    if (!user || body.password !== 'test123') {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response: SignInResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: `mock-jwt-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return HttpResponse.json(response);
  }),

  // SignUpUseCase
  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as SignUpRequest;
    
    // 이미 존재하는 이메일 체크
    const existingUser = Object.values(mockUsers).find(u => u.email === body.email);
    if (existingUser) {
      return HttpResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const newUserId = `user-${Date.now()}`;
    const response: SignUpResponse = {
      user: {
        id: newUserId,
        email: body.email,
        name: body.name,
        role: body.role
      },
      token: `mock-jwt-token-${newUserId}`,
      refreshToken: `mock-refresh-token-${newUserId}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return HttpResponse.json(response);
  }),

  // GetProfileUseCase
  http.get('/api/auth/profile/:userId', ({ params }) => {
    const { userId } = params;
    const user = mockUsers[userId as keyof typeof mockUsers];
    
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(user.profile);
  }),

  // UpdateProfileUseCase
  http.put('/api/auth/profile/:userId', async ({ params, request }) => {
    const { userId } = params;
    const body = await request.json() as UpdateProfileRequest;
    const user = mockUsers[userId as keyof typeof mockUsers];
    
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 업데이트된 프로필 반환
    const updatedProfile = {
      ...user.profile,
      ...body,
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json(updatedProfile);
  }),

  // CreateInviteUseCase
  http.post('/api/auth/invites', async ({ request }) => {
    const body = await request.json() as CreateInviteDto;
    
    // 이메일 중복 체크 - 도메인 규칙 모방
    const existingInvite = mockInvites.find(invite => 
      invite.email === body.email && 
      invite.organizationId === body.organizationId &&
      invite.isValid
    );
    
    if (existingInvite) {
      return HttpResponse.json(
        { error: 'An active invite already exists for this email in this organization' },
        { status: 409 }
      );
    }

    const newInvite: InviteDto = {
      id: `invite-${Date.now()}`,
      email: body.email,
      role: body.role,
      organizationId: body.organizationId,
      classId: body.classId,
      token: `mock-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + (body.expiryDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: body.createdBy,
      createdAt: new Date().toISOString(),
      isExpired: false,
      isUsed: false,
      isValid: true
    };

    // Mock 데이터에 추가
    mockInvites.push(newInvite);

    return HttpResponse.json(newInvite, { status: 201 });
  }),

  // FindInvitesByCreatorUseCase
  http.get('/api/auth/invites/by-creator/:creatorId', ({ params, request }) => {
    const { creatorId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'pending' | 'used' | 'expired'
    const role = url.searchParams.get('role'); // 'student' | 'teacher' | 'admin'
    
    let filteredInvites = mockInvites.filter(invite => invite.createdBy === creatorId);
    
    // 상태 필터링
    if (status) {
      filteredInvites = filteredInvites.filter(invite => {
        if (status === 'pending') return invite.isValid && !invite.isUsed;
        if (status === 'used') return invite.isUsed;
        if (status === 'expired') return invite.isExpired;
        return true;
      });
    }
    
    // 역할 필터링
    if (role) {
      filteredInvites = filteredInvites.filter(invite => invite.role === role);
    }
    
    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvites = filteredInvites.slice(startIndex, endIndex);

    return HttpResponse.json({
      invites: paginatedInvites,
      totalCount: filteredInvites.length,
      page,
      limit,
      hasMore: endIndex < filteredInvites.length
    });
  }),

  // FindInvitesByOrganizationUseCase
  http.get('/api/auth/invites/by-organization/:organizationId', ({ params, request }) => {
    const { organizationId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const filteredInvites = mockInvites.filter(invite => invite.organizationId === organizationId);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvites = filteredInvites.slice(startIndex, endIndex);

    return HttpResponse.json({
      invites: paginatedInvites,
      totalCount: filteredInvites.length,
      page,
      limit
    });
  }),

  // ValidateInviteTokenUseCase
  http.post('/api/auth/invites/validate', async ({ request }) => {
    const body = await request.json() as ValidateInviteTokenDto;
    
    const invite = mockInvites.find(inv => inv.token === body.token);
    
    if (!invite) {
      const response: InviteTokenValidationDto = {
        isValid: false,
        errorMessage: 'Invalid invite token'
      };
      return HttpResponse.json(response);
    }

    const response: InviteTokenValidationDto = {
      isValid: invite.isValid,
      invite: invite.isValid ? invite : undefined,
      errorMessage: !invite.isValid ? 
        (invite.isExpired ? 'Invite has expired' : 
         invite.isUsed ? 'Invite has already been used' : 'Invalid invite') 
        : undefined
    };

    return HttpResponse.json(response);
  }),

  // UseInviteTokenUseCase
  http.post('/api/auth/invites/use', async ({ request }) => {
    const body = await request.json() as UseInviteTokenDto;
    
    const inviteIndex = mockInvites.findIndex(inv => inv.token === body.token);
    const invite = mockInvites[inviteIndex];
    
    if (!invite || !invite.isValid) {
      return HttpResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 400 }
      );
    }

    // 초대 사용 처리 - 도메인 로직 모방
    const updatedInvite: InviteDto = {
      ...invite,
      isUsed: true,
      isValid: false,
      usedAt: new Date().toISOString(),
      usedBy: body.userId
    };
    
    mockInvites[inviteIndex] = updatedInvite;

    return HttpResponse.json({
      success: true,
      invite: updatedInvite,
      message: 'Invite successfully used'
    });
  }),

  // DeleteInviteUseCase
  http.delete('/api/auth/invites/:inviteId', ({ params }) => {
    const { inviteId } = params;
    const inviteIndex = mockInvites.findIndex(inv => inv.id === inviteId);
    
    if (inviteIndex === -1) {
      return HttpResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    mockInvites.splice(inviteIndex, 1);

    return HttpResponse.json({ success: true });
  }),

  // DeleteExpiredInvitesUseCase
  http.delete('/api/auth/invites/expired', () => {
    const initialCount = mockInvites.length;
    const activeInvites = mockInvites.filter(invite => !invite.isExpired);
    const deletedCount = initialCount - activeInvites.length;
    
    // Mock 데이터 업데이트
    mockInvites.length = 0;
    mockInvites.push(...activeInvites);

    return HttpResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} expired invites deleted`
    });
  }),

  // FindProfilesByRoleUseCase
  http.get('/api/auth/profiles/by-role/:role', ({ params, request }) => {
    const { role } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    let profiles = Object.values(mockUsers)
      .filter(user => user.role === role)
      .map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.name,
        displayName: user.name,
        initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        role: user.role,
        schoolId: 'school-1',
        gradeLevel: user.profile.grade,
        avatarUrl: user.profile.profileImageUrl,
        hasAvatar: !!user.profile.profileImageUrl,
        settings: {
          theme: 'light',
          language: user.profile.preferences.language,
          notifications: {
            email: user.profile.preferences.emailNotification,
            push: true,
            sms: false
          },
          privacy: {
            showEmail: true,
            showActivity: true
          }
        },
        createdAt: user.profile.createdAt,
        updatedAt: user.profile.updatedAt
      }));

    // 검색 필터링
    if (search) {
      profiles = profiles.filter(profile => 
        profile.fullName.toLowerCase().includes(search.toLowerCase()) ||
        profile.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProfiles = profiles.slice(startIndex, endIndex);

    return HttpResponse.json({
      profiles: paginatedProfiles,
      totalCount: profiles.length,
      page,
      limit
    });
  }),

  // GetRoleStatisticsUseCase
  http.get('/api/auth/statistics/roles', () => {
    const allUsers = Object.values(mockUsers);
    const statistics: RoleStatistics = {
      totalUsers: allUsers.length,
      students: allUsers.filter(u => u.role === 'student').length,
      teachers: allUsers.filter(u => u.role === 'teacher').length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      activeInvites: mockInvites.filter(inv => inv.isValid && !inv.isUsed).length,
      expiredInvites: mockInvites.filter(inv => inv.isExpired).length
    };

    return HttpResponse.json(statistics);
  }),

  // ChangeRoleUseCase
  http.post('/api/auth/users/:targetUserId/role', async ({ params, request }) => {
    const { targetUserId } = params;
    const body = await request.json() as ChangeRoleDto;
    
    const user = mockUsers[targetUserId as keyof typeof mockUsers];
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 역할 변경 - 도메인 규칙 적용 가능 (예: 관리자만 다른 관리자를 만들 수 있음 등)
    const updatedUser = {
      ...user,
      role: body.newRole as 'student' | 'teacher' | 'admin'
    };

    // Mock 데이터 업데이트
    (mockUsers as any)[targetUserId] = updatedUser;

    return HttpResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  }),

  // CheckEmailExistsUseCase
  http.get('/api/auth/check-email/:email', ({ params }) => {
    const { email } = params;
    const emailExists = Object.values(mockUsers).some(user => user.email === email);
    
    return HttpResponse.json({
      exists: emailExists,
      email: decodeURIComponent(email)
    });
  }),
];

// Dashboard 핸들러들
export const dashboardHandlers = [
  // GetStudentDashboardUseCase
  http.get('/api/dashboard/student/:studentId', ({ params }) => {
    const { studentId } = params;
    
    const response: GetStudentDashboardResponse = {
      dashboard: {
        student: {
          id: studentId as string,
          name: mockUsers[studentId as keyof typeof mockUsers]?.name || '학생',
          email: mockUsers[studentId as keyof typeof mockUsers]?.email || 'student@test.com'
        },
        progress: {
          studentId: studentId as string,
          studyStreak: {
            id: 'streak-1',
            studentId: studentId as string,
            currentStreak: studentId === 'student-1' ? 15 : studentId === 'student-2' ? 8 : 3,
            longestStreak: studentId === 'student-1' ? 28 : studentId === 'student-2' ? 15 : 7,
            lastStudyDate: new Date(),
            isActive: true,
            isAtRisk: false,
            isPersonalRecord: false,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          statistics: [
            {
              id: 'stats-1',
              studentId: studentId as string,
              problemSetId: 'ps-1',
              totalProblems: 50,
              completedProblems: 35,
              correctAnswers: 28,
              completionRate: 0.7,
              accuracyRate: 0.8,
              overallAccuracyRate: 0.78,
              totalTimeSpent: 3600000,
              averageResponseTime: 45000,
              averageResponseTimeInSeconds: 45,
              totalTimeInMinutes: 60,
              isCompleted: false,
              progressStatus: 'in_progress',
              performanceGrade: 'B',
              efficiencyScore: 85,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          overallMetrics: {
            totalProblemSets: 10,
            completedProblemSets: 3,
            averageCompletionRate: 0.65,
            averageAccuracyRate: 0.78,
            totalStudyTime: 14400000,
            totalStudyTimeInMinutes: 240,
            efficiencyScore: 82
          }
        },
        recentActivity: [
          {
            date: new Date(),
            problemSetsWorkedOn: 2,
            problemsCompleted: 15,
            correctAnswers: 12,
            timeSpent: 3600000
          },
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            problemSetsWorkedOn: 1,
            problemsCompleted: 8,
            correctAnswers: 7,
            timeSpent: 1800000
          }
        ],
        achievements: {
          streakMilestones: [7, 14],
          completedSets: 3,
          perfectScores: 2,
          totalProblemsCompleted: 145
        },
        recommendations: [
          {
            type: 'continue_streak',
            title: '스트릭 유지하기',
            description: '연속 학습 기록을 이어가세요',
            actionUrl: '/study/today'
          },
          {
            type: 'review_weak_areas',
            title: '틀린 문제 복습',
            description: '정답률이 낮은 영역을 다시 학습해보세요',
            actionUrl: '/study/review'
          }
        ]
      },
      fromCache: false
    };

    return HttpResponse.json(response);
  }),
];

// SRS 핸들러들
export const srsHandlers = [
  // GetTodayReviewsUseCase
  http.get('/api/srs/reviews/today/:studentId', ({ params }) => {
    const { studentId } = params;
    
    const response: GetTodayReviewsResponse = {
      queue: {
        items: [
          {
            scheduleId: 'schedule-1',
            problemId: 'problem-1',
            problemTitle: '이차방정식 기본',
            problemContent: 'x² - 5x + 6 = 0을 풀어보세요.',
            currentInterval: 1,
            easeFactor: 2.5,
            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            dueDate: new Date(),
            priority: 'high',
            isOverdue: false,
            difficultyLevel: 'medium',
            tags: ['algebra', 'quadratic'],
            estimatedDuration: 300
          },
          {
            scheduleId: 'schedule-2',
            problemId: 'problem-2',
            problemTitle: '함수의 그래프',
            problemContent: 'y = 2x + 3의 그래프를 그려보세요.',
            currentInterval: 3,
            easeFactor: 2.8,
            nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            priority: 'medium',
            isOverdue: true,
            difficultyLevel: 'easy',
            tags: ['function', 'graph'],
            estimatedDuration: 240
          }
        ],
        totalItems: 2,
        overdueCount: 1,
        totalEstimatedTime: 540
      },
      todayStats: {
        reviewsCompleted: 5,
        reviewsRemaining: 2,
        accuracy: 0.8,
        averageResponseTime: 45.5,
        streakMaintained: true,
        newCardsIntroduced: 1,
        cardsGraduated: 2
      }
    };

    return HttpResponse.json(response);
  }),

  // SubmitReviewFeedbackUseCase
  http.post('/api/srs/reviews/feedback', async ({ request }) => {
    const body = await request.json() as SubmitReviewFeedbackRequest;
    
    return HttpResponse.json({
      success: true,
      nextInterval: body.difficulty === 'again' ? 1 : 
                   body.difficulty === 'hard' ? 3 :
                   body.difficulty === 'good' ? 7 : 14,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      streakMaintained: true,
      tokensEarned: body.difficulty === 'easy' ? 10 : 
                   body.difficulty === 'good' ? 5 : 2
    });
  }),

  // GetReviewStatisticsUseCase
  http.get('/api/srs/statistics/:studentId', ({ params }) => {
    const { studentId } = params;
    
    const response: GetReviewStatisticsResponse = {
      overallStats: {
        totalReviews: 156,
        totalCorrect: 124,
        totalIncorrect: 32,
        averageAccuracy: 0.795,
        averageResponseTime: 42.3,
        currentStreak: 12,
        longestStreak: 18,
        totalStudyTime: 7200,
        cardsLearning: 15,
        cardsReview: 45,
        cardsMature: 78
      },
      dailyReviews: Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reviewCount: Math.floor(Math.random() * 20) + 5,
        correctCount: Math.floor(Math.random() * 15) + 5,
        accuracy: Math.random() * 0.4 + 0.6,
        averageTime: Math.random() * 20 + 30
      })).reverse(),
      difficultyBreakdown: {
        again: 12,
        hard: 28,
        good: 89,
        easy: 47
      },
      performanceTrends: {
        weekOverWeek: {
          reviewsChange: 0.15,
          accuracyChange: 0.03,
          timeChange: -0.08
        },
        monthOverMonth: {
          reviewsChange: 0.28,
          accuracyChange: 0.07,
          timeChange: -0.12
        }
      }
    };

    return HttpResponse.json(response);
  }),
];

// Progress 핸들러들
export const progressHandlers = [
  // GetClassProgressUseCase
  http.get('/api/progress/class/:classId', ({ params }) => {
    const { classId } = params;
    
    const response: GetClassProgressResponse = {
      classProgress: {
        classId: classId as string,
        className: '중학교 1학년 A반',
        teacherId: 'teacher-1',
        streaks: [
          {
            id: 'streak-1',
            studentId: 'student-1',
            currentStreak: 15,
            longestStreak: 28,
            lastStudyDate: new Date(),
            isActive: true,
            isAtRisk: false,
            isPersonalRecord: false,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'streak-2',
            studentId: 'student-2',
            currentStreak: 8,
            longestStreak: 15,
            lastStudyDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isActive: true,
            isAtRisk: true,
            isPersonalRecord: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        statistics: [
          {
            id: 'stats-1',
            studentId: 'student-1',
            problemSetId: 'ps-1',
            totalProblems: 50,
            completedProblems: 45,
            correctAnswers: 38,
            completionRate: 0.9,
            accuracyRate: 0.84,
            overallAccuracyRate: 0.84,
            totalTimeSpent: 5400000,
            averageResponseTime: 40000,
            averageResponseTimeInSeconds: 40,
            totalTimeInMinutes: 90,
            isCompleted: false,
            progressStatus: 'in_progress',
            performanceGrade: 'A',
            efficiencyScore: 92,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        classMetrics: {
          totalStudents: 25,
          activeStreakCount: 18,
          averageCurrentStreak: 8.5,
          averageCompletionRate: 0.72,
          averageAccuracyRate: 0.76,
          studentsWithStreak: 20,
          studiedToday: 15,
          atRiskStudents: 3
        }
      },
      insights: [
        {
          type: 'high_performer',
          studentId: 'student-1',
          message: '우수한 성과를 보이고 있습니다',
          priority: 'low',
          suggestions: ['추가 도전 문제 제공']
        },
        {
          type: 'needs_attention',
          studentId: 'student-3',
          message: '학습에 어려움을 겪고 있습니다',
          priority: 'high',
          suggestions: ['개별 지도 필요']
        }
      ],
      summary: {
        totalStudents: 25,
        engagementLevel: 'high',
        averagePerformance: {
          completionRate: 0.72,
          accuracyRate: 0.76,
          currentStreak: 8.5
        },
        recommendations: [
          {
            action: '스트릭 유지 동기부여 프로그램 실시',
            reason: '3명의 학생이 스트릭이 끊어질 위험에 있습니다'
          }
        ]
      }
    };

    return HttpResponse.json(response);
  }),

  // GetStreakRankingsUseCase
  http.get('/api/progress/streaks/rankings', ({ params, request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    const rankings: StreakRankingDto = {
      rankings: [
        {
          rank: 1,
          studentId: 'student-1',
          studentName: studentId === 'student-1' ? mockUsers['student-1'].name : undefined,
          currentStreak: 45,
          longestStreak: 52,
          lastStudyDate: new Date(),
          isActive: true
        },
        {
          rank: 2,
          studentId: 'student-2',
          studentName: studentId === 'student-2' ? mockUsers['student-2'].name : undefined,
          currentStreak: 38,
          longestStreak: 45,
          lastStudyDate: new Date(),
          isActive: true
        },
        {
          rank: 3,
          studentId: 'student-3',
          currentStreak: 32,
          longestStreak: 38,
          lastStudyDate: new Date(Date.now() - 60 * 60 * 1000),
          isActive: true
        }
      ],
      myRanking: studentId ? {
        rank: studentId === 'student-1' ? 1 : studentId === 'student-2' ? 2 : 15,
        currentStreak: studentId === 'student-1' ? 45 : studentId === 'student-2' ? 38 : 5,
        longestStreak: studentId === 'student-1' ? 52 : studentId === 'student-2' ? 45 : 12
      } : undefined
    };

    return HttpResponse.json({
      rankings,
      filters: {
        limit: parseInt(url.searchParams.get('limit') || '10'),
        isClassSpecific: false,
        classId: undefined
      }
    });
  }),
];

// Gamification 핸들러들
export const gamificationHandlers = [
  // GetLeaderboardsUseCase
  http.get('/api/gamification/leaderboards', ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    const response: LeaderboardSummaryDto = {
      tokenBalance: {
        type: 'token_balance',
        displayName: '토큰 잔액',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-1',
            studentName: studentId === 'student-1' ? mockUsers['student-1'].name : '학생 A',
            rank: 1,
            score: 2450,
            rankChange: 2,
            badges: ['🏆', '🔥']
          },
          {
            id: 'entry-2',
            studentId: 'student-2',
            studentName: studentId === 'student-2' ? mockUsers['student-2'].name : '학생 B',
            rank: 2,
            score: 1980,
            rankChange: -1,
            badges: ['⭐']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        currentUserRank: studentId ? {
          rank: studentId === 'student-1' ? 1 : studentId === 'student-2' ? 2 : 15,
          score: studentId === 'student-1' ? 2450 : studentId === 'student-2' ? 1980 : 420,
          percentile: studentId === 'student-1' ? 98 : studentId === 'student-2' ? 95 : 70
        } : undefined
      },
      tokenEarned: {
        type: 'token_earned',
        displayName: '총 획득 토큰',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-2',
            studentName: studentId === 'student-2' ? mockUsers['student-2'].name : '학생 B',
            rank: 1,
            score: 5200,
            rankChange: 0,
            badges: ['🏆', '💰']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        currentUserRank: studentId ? {
          rank: studentId === 'student-2' ? 1 : studentId === 'student-1' ? 2 : 20,
          score: studentId === 'student-2' ? 5200 : studentId === 'student-1' ? 4850 : 1200,
          percentile: studentId === 'student-2' ? 98 : studentId === 'student-1' ? 96 : 58
        } : undefined
      },
      achievements: {
        type: 'achievements',
        displayName: '업적 개수',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-3',
            studentName: '학생 C',
            rank: 1,
            score: 28,
            rankChange: 2,
            badges: ['🏆', '🌟', '💫']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        currentUserRank: studentId ? {
          rank: studentId === 'student-3' ? 1 : studentId === 'student-1' ? 2 : 25,
          score: studentId === 'student-3' ? 28 : studentId === 'student-1' ? 25 : 8,
          percentile: studentId === 'student-3' ? 98 : studentId === 'student-1' ? 96 : 47
        } : undefined
      },
      weeklyTokens: {
        type: 'weekly_tokens',
        displayName: '이번 주 토큰',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-1',
            studentName: studentId === 'student-1' ? mockUsers['student-1'].name : '학생 A',
            rank: 1,
            score: 850,
            rankChange: 3,
            badges: ['🚀', '🔥']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        periodStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        currentUserRank: studentId ? {
          rank: studentId === 'student-1' ? 1 : studentId === 'student-3' ? 2 : 18,
          score: studentId === 'student-1' ? 850 : studentId === 'student-3' ? 720 : 150,
          percentile: studentId === 'student-1' ? 98 : studentId === 'student-3' ? 96 : 62
        } : undefined
      }
    };

    return HttpResponse.json(response);
  }),

  // GetAvailableRewardsUseCase (가상)
  http.get('/api/gamification/rewards/available', ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    const mockRewards: RewardDto[] = [
      {
        id: 'reward-1',
        code: 'digital-badge-first-place',
        name: '1등 달성 배지',
        description: '처음으로 1등을 달성한 학생에게 주어지는 특별한 배지입니다.',
        category: 'digital_badge',
        tokenCost: 500,
        currentRedemptions: 12,
        isActive: true,
        iconUrl: '🥇',
        createdAt: new Date().toISOString(),
        isAvailable: true,
        canAfford: true
      },
      {
        id: 'reward-2',
        code: 'feature-unlock-advanced-stats',
        name: '고급 통계 기능 잠금 해제',
        description: '상세한 학습 분석과 개인 맞춤 리포트를 확인할 수 있는 기능을 7일간 이용할 수 있습니다.',
        category: 'feature_unlock',
        tokenCost: 300,
        maxRedemptions: 1,
        currentRedemptions: 0,
        remainingStock: 1,
        isActive: true,
        iconUrl: '📊',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        isAvailable: true,
        canAfford: true
      }
    ];

    return HttpResponse.json({
      rewards: mockRewards,
      categories: [
        {
          category: 'digital_badge',
          displayName: '디지털 배지',
          rewards: mockRewards.filter(r => r.category === 'digital_badge'),
          totalCount: 1
        },
        {
          category: 'feature_unlock',
          displayName: '기능 잠금 해제',
          rewards: mockRewards.filter(r => r.category === 'feature_unlock'),
          totalCount: 1
        }
      ],
      studentTokenBalance: studentId === 'student-1' ? 850 : studentId === 'student-2' ? 620 : 350,
      recentRedemptions: []
    });
  }),

  // RedeemRewardUseCase
  http.post('/api/gamification/rewards/redeem', async ({ request }) => {
    const body = await request.json() as { studentId: string; rewardCode: string };
    
    const redemption: RewardRedemptionDto = {
      id: `redemption-${Date.now()}`,
      studentId: body.studentId,
      rewardId: 'reward-1',
      tokenCost: 500,
      status: 'completed',
      redeemedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      processingTimeMinutes: 0
    };

    return HttpResponse.json(redemption);
  }),
];

// Problems UseCase 핸들러들
const problemHandlers = [
  // GetProblemListUseCase
  http.get('/api/problems', ({ request }) => {
    const url = new URL(request.url);
    const teacherId = url.searchParams.get('teacherId');
    const isActive = url.searchParams.get('isActive');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    let filteredProblems = mockProblems;
    
    if (teacherId) {
      filteredProblems = filteredProblems.filter(p => p.teacherId === teacherId);
    }
    
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      filteredProblems = filteredProblems.filter(p => p.isActive === activeFilter);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProblems = filteredProblems.slice(startIndex, endIndex);
    
    const response: GetProblemListOutput = {
      problems: paginatedProblems.map(p => ({
        id: p.id,
        teacherId: p.teacherId,
        title: p.title,
        description: p.description || '',
        type: p.type,
        difficulty: p.difficulty,
        tags: p.tags,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      totalCount: filteredProblems.length,
      page,
      limit,
      hasNext: endIndex < filteredProblems.length
    };
    
    return HttpResponse.json(response);
  }),

  // GetProblemUseCase
  http.get('/api/problems/:id', ({ params }) => {
    const problemId = params.id as string;
    const problem = mockProblems.find(p => p.id === problemId);
    
    if (!problem) {
      return HttpResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(problem);
  }),

  // SearchProblemsUseCase
  http.post('/api/problems/search', async ({ request }) => {
    const body = await request.json() as ProblemSearchRequestDto;
    
    let filteredProblems = mockProblems;
    
    // 검색어 필터링
    if (body.searchQuery) {
      const query = body.searchQuery.toLowerCase();
      filteredProblems = filteredProblems.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 타입 필터링
    if (body.types && body.types.length > 0) {
      filteredProblems = filteredProblems.filter(p => body.types!.includes(p.type));
    }
    
    // 난이도 필터링
    if (body.difficulties && body.difficulties.length > 0) {
      filteredProblems = filteredProblems.filter(p => body.difficulties!.includes(p.difficulty));
    }
    
    // 태그 필터링
    if (body.tags && body.tags.length > 0) {
      filteredProblems = filteredProblems.filter(p => 
        body.tags!.some(tag => p.tags.includes(tag))
      );
    }
    
    // 활성 상태 필터링
    if (body.isActive !== undefined) {
      filteredProblems = filteredProblems.filter(p => p.isActive === body.isActive);
    }
    
    const response: ProblemSearchResponseDto = {
      problems: filteredProblems.map(p => ({
        id: p.id,
        teacherId: p.teacherId,
        title: p.title,
        description: p.description || '',
        type: p.type,
        difficulty: p.difficulty,
        tags: p.tags,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      totalCount: filteredProblems.length,
      metadata: {
        hasNextPage: false,
        hasPreviousPage: false,
        appliedFilters: Object.keys(body).filter(key => body[key as keyof ProblemSearchRequestDto] !== undefined)
      }
    };
    
    return HttpResponse.json(response);
  }),

  // CreateProblemUseCase
  http.post('/api/problems', async ({ request }) => {
    const body = await request.json() as CreateProblemInput;
    
    const newProblem: ProblemOutput = {
      id: `problem-${Date.now()}`,
      teacherId: body.teacherId,
      title: body.title,
      description: body.description || '',
      type: body.type,
      difficulty: body.difficultyLevel,
      tags: body.tags || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const response: CreateProblemOutput = {
      problem: newProblem
    };
    
    return HttpResponse.json(response);
  }),

  // UpdateProblemContentUseCase
  http.put('/api/problems/:id/content', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as UpdateProblemContentInput;
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== body.teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedProblem: ProblemOutput = {
      id: problem.id,
      teacherId: problem.teacherId,
      title: body.title,
      description: body.description,
      type: problem.type,
      difficulty: problem.difficulty,
      tags: problem.tags,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(updatedProblem);
  }),

  // UpdateProblemAnswerUseCase
  http.put('/api/problems/:id/answer', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as UpdateProblemAnswerInput;
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== body.teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedProblem: ProblemOutput = {
      id: problem.id,
      teacherId: problem.teacherId,
      title: problem.title,
      description: problem.description || '',
      type: problem.type,
      difficulty: problem.difficulty,
      tags: problem.tags,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(updatedProblem);
  }),

  // ChangeProblemDifficultyUseCase
  http.put('/api/problems/:id/difficulty', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as ChangeProblemDifficultyInput;
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== body.teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedProblem: ProblemOutput = {
      id: problem.id,
      teacherId: problem.teacherId,
      title: problem.title,
      description: problem.description || '',
      type: problem.type,
      difficulty: body.newDifficultyLevel,
      tags: problem.tags,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(updatedProblem);
  }),

  // ManageProblemTagsUseCase
  http.put('/api/problems/:id/tags', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as ManageProblemTagsInput;
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== body.teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedProblem: ProblemOutput = {
      id: problem.id,
      teacherId: problem.teacherId,
      title: problem.title,
      description: problem.description || '',
      type: problem.type,
      difficulty: problem.difficulty,
      tags: body.tags,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(updatedProblem);
  }),

  // ActivateProblemUseCase
  http.put('/api/problems/:id/activate', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as ActivateProblemInput;
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== body.teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedProblem: ProblemOutput = {
      id: problem.id,
      teacherId: problem.teacherId,
      title: problem.title,
      description: problem.description || '',
      type: problem.type,
      difficulty: problem.difficulty,
      tags: problem.tags,
      isActive: true,
      createdAt: problem.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(updatedProblem);
  }),

  // DeactivateProblemUseCase
  http.put('/api/problems/:id/deactivate', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as DeactivateProblemInput;
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== body.teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedProblem: ProblemOutput = {
      id: problem.id,
      teacherId: problem.teacherId,
      title: problem.title,
      description: problem.description || '',
      type: problem.type,
      difficulty: problem.difficulty,
      tags: problem.tags,
      isActive: false,
      createdAt: problem.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(updatedProblem);
  }),

  // DeleteProblemUseCase
  http.delete('/api/problems/:id', async ({ params, request }) => {
    const problemId = params.id as string;
    const url = new URL(request.url);
    const teacherId = url.searchParams.get('teacherId');
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    if (problem.teacherId !== teacherId) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // 실제로는 배열에서 제거하지만, 여기서는 성공 응답만 반환
    return HttpResponse.json({ success: true });
  }),

  // CloneProblemUseCase
  http.post('/api/problems/:id/clone', async ({ params, request }) => {
    const problemId = params.id as string;
    const body = await request.json() as CloneProblemInput;
    
    const originalProblem = mockProblems.find(p => p.id === problemId);
    if (!originalProblem) {
      return HttpResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    const clonedProblem: ProblemOutput = {
      id: `problem-${Date.now()}-clone`,
      teacherId: body.newTeacherId || body.requesterId,
      title: `${originalProblem.title} (복사본)`,
      description: originalProblem.description || '',
      type: originalProblem.type,
      difficulty: originalProblem.difficulty,
      tags: body.preserveOriginalTags ? originalProblem.tags : [],
      isActive: false, // 복사본은 기본적으로 비활성
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(clonedProblem);
  })
];

// 모든 핸들러들을 통합
export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...srsHandlers,
  ...progressHandlers,
  ...gamificationHandlers,
  ...problemHandlers,
];