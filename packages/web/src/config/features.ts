/**
 * Feature Flag 설정
 * 각 UseCase별 UI 표면 노출 제어
 */

export interface FeatureFlags {
  // Auth Features - UseCase별 세분화
  signUp: boolean;
  signIn: boolean;
  signOut: boolean;
  profile: boolean;
  profileCreation: boolean;
  profileUpdate: boolean;
  inviteSystem: boolean;
  inviteCreation: boolean;
  inviteValidation: boolean;
  roleManagement: boolean;
  roleChange: boolean;
  passwordReset: boolean;
  
  // User Management Features
  userDirectory: boolean;
  userSearch: boolean;
  userDetails: boolean;
  emailCheck: boolean;
  userDeletion: boolean;
  
  // Profile Management Features
  profilesByRole: boolean;
  profilesBySchool: boolean;
  studentsByGrade: boolean;
  profileDeletion: boolean;
  
  // Invite Management Features
  invitesByCreator: boolean;
  invitesByEmail: boolean;
  invitesByOrganization: boolean;
  inviteDeletion: boolean;
  expiredInviteCleanup: boolean;
  
  // Statistics & Analytics
  roleStatistics: boolean;
  userAnalytics: boolean;
  
  // Dashboard Features  
  studentDashboard: boolean;
  teacherDashboard: boolean;
  adminDashboard: boolean;
  gamificationDashboard: boolean;
  
  // Problem Features - UseCase별 세분화
  problemBank: boolean;
  problemSets: boolean;
  problemEditor: boolean;
  grading: boolean;
  analytics: boolean;
  
  // Problem Management Features - UseCase 기반
  problemList: boolean;
  problemDetail: boolean;
  problemSearch: boolean;
  problemCreation: boolean;
  problemContentUpdate: boolean;
  problemAnswerUpdate: boolean;
  problemDifficultyChange: boolean;
  problemTagManagement: boolean;
  problemActivation: boolean;
  problemDeactivation: boolean;
  problemDeletion: boolean;
  problemCloning: boolean;
  
  // SRS Features
  srs: boolean;
  reviewSystem: boolean;
  notifications: boolean;
  
  // Progress Features
  progressTracking: boolean;
  streakRankings: boolean;
  classProgress: boolean;
  
  // Gamification Features
  tokenSystem: boolean;
  achievements: boolean;
  leaderboards: boolean;
  rewards: boolean;
}

// 환경 변수에서 Feature Flag 값을 가져오는 헬퍼 함수
const getEnvFlag = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true';
};

// 환경별 기본값 설정
const getDefaultFlags = (): FeatureFlags => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  
  if (env === 'production') {
    return {
      // Auth Features - 활성화
      signUp: true,
      signIn: true,
      signOut: true,
      profile: true,
      profileCreation: true,
      profileUpdate: true,
      inviteSystem: true,
      inviteCreation: true,
      inviteValidation: true,
      roleManagement: true,
      roleChange: true,
      passwordReset: true,
      
      // User Management - 활성화
      userDirectory: true,
      userSearch: true,
      userDetails: true,
      emailCheck: true,
      userDeletion: true,
      
      // Profile Management - 활성화
      profilesByRole: true,
      profilesBySchool: true,
      studentsByGrade: true,
      profileDeletion: true,
      
      // Invite Management - 활성화
      invitesByCreator: true,
      invitesByEmail: true,
      invitesByOrganization: true,
      inviteDeletion: true,
      expiredInviteCleanup: true,
      
      // Statistics - 활성화
      roleStatistics: true,
      userAnalytics: true,
      
      // Dashboard Features - 관리자 포함 활성화
      studentDashboard: true,
      teacherDashboard: true,
      adminDashboard: true,
      gamificationDashboard: false, // 게임화는 비활성화
      problemBank: true,
      problemSets: true,
      problemEditor: true, // 문제 편집 활성화
      grading: true,
      analytics: true,
      
      // Problem Management - 모든 기능 활성화
      problemList: true,
      problemDetail: true,
      problemSearch: true,
      problemCreation: true,
      problemContentUpdate: true,
      problemAnswerUpdate: true,
      problemDifficultyChange: true,
      problemTagManagement: true,
      problemActivation: true,
      problemDeactivation: true,
      problemDeletion: true,
      problemCloning: true,
      
      // SRS Features - 활성화
      srs: true,
      reviewSystem: true,
      notifications: true,
      progressTracking: true,
      streakRankings: true,
      classProgress: true,
      
      // Gamification - 비활성화 유지
      tokenSystem: false,
      achievements: false,
      leaderboards: false,
      rewards: false,
    };
  }
  
  // 개발/스테이징 환경 기본값 - 모든 기능 활성화
  return {
    // Auth Features - 모두 활성화
    signUp: true,
    signIn: true,
    signOut: true,
    profile: true,
    profileCreation: true,
    profileUpdate: true,
    inviteSystem: true,
    inviteCreation: true,
    inviteValidation: true,
    roleManagement: true,
    roleChange: true,
    passwordReset: true,
    
    // User Management - 모두 활성화
    userDirectory: true,
    userSearch: true,
    userDetails: true,
    emailCheck: true,
    userDeletion: true,
    
    // Profile Management - 모두 활성화
    profilesByRole: true,
    profilesBySchool: true,
    studentsByGrade: true,
    profileDeletion: true,
    
    // Invite Management - 모두 활성화
    invitesByCreator: true,
    invitesByEmail: true,
    invitesByOrganization: true,
    inviteDeletion: true,
    expiredInviteCleanup: true,
    
    // Statistics - 모두 활성화
    roleStatistics: true,
    userAnalytics: true,
    
    // 기존 Features
    studentDashboard: true,
    teacherDashboard: true,
    adminDashboard: true,
    gamificationDashboard: true,
    problemBank: true,
    problemSets: true,
    problemEditor: true,
    grading: true,
    analytics: true,
    
    // Problem Management - 개발환경 모두 활성화
    problemList: true,
    problemDetail: true,
    problemSearch: true,
    problemCreation: true,
    problemContentUpdate: true,
    problemAnswerUpdate: true,
    problemDifficultyChange: true,
    problemTagManagement: true,
    problemActivation: true,
    problemDeactivation: true,
    problemDeletion: true,
    problemCloning: true,
    srs: true,
    reviewSystem: true,
    notifications: true,
    progressTracking: true,
    streakRankings: true,
    classProgress: true,
    tokenSystem: true,
    achievements: true,
    leaderboards: true,
    rewards: true,
  };
};

// 환경 변수 기반 Feature Flag 설정
const defaultFlags = getDefaultFlags();

export const features: FeatureFlags = {
  // Auth Features - UseCase별 세분화된 환경 변수 제어
  signUp: getEnvFlag('VITE_FEATURE_SIGNUP', defaultFlags.signUp),
  signIn: getEnvFlag('VITE_FEATURE_SIGNIN', defaultFlags.signIn),
  signOut: getEnvFlag('VITE_FEATURE_SIGNOUT', defaultFlags.signOut),
  profile: getEnvFlag('VITE_FEATURE_PROFILE', defaultFlags.profile),
  profileCreation: getEnvFlag('VITE_FEATURE_PROFILE_CREATION', defaultFlags.profileCreation),
  profileUpdate: getEnvFlag('VITE_FEATURE_PROFILE_UPDATE', defaultFlags.profileUpdate),
  inviteSystem: getEnvFlag('VITE_FEATURE_INVITE_SYSTEM', defaultFlags.inviteSystem),
  inviteCreation: getEnvFlag('VITE_FEATURE_INVITE_CREATION', defaultFlags.inviteCreation),
  inviteValidation: getEnvFlag('VITE_FEATURE_INVITE_VALIDATION', defaultFlags.inviteValidation),
  roleManagement: getEnvFlag('VITE_FEATURE_ROLE_MANAGEMENT', defaultFlags.roleManagement),
  roleChange: getEnvFlag('VITE_FEATURE_ROLE_CHANGE', defaultFlags.roleChange),
  passwordReset: getEnvFlag('VITE_FEATURE_PASSWORD_RESET', defaultFlags.passwordReset),
  
  // User Management Features
  userDirectory: getEnvFlag('VITE_FEATURE_USER_DIRECTORY', defaultFlags.userDirectory),
  userSearch: getEnvFlag('VITE_FEATURE_USER_SEARCH', defaultFlags.userSearch),
  userDetails: getEnvFlag('VITE_FEATURE_USER_DETAILS', defaultFlags.userDetails),
  emailCheck: getEnvFlag('VITE_FEATURE_EMAIL_CHECK', defaultFlags.emailCheck),
  userDeletion: getEnvFlag('VITE_FEATURE_USER_DELETION', defaultFlags.userDeletion),
  
  // Profile Management Features
  profilesByRole: getEnvFlag('VITE_FEATURE_PROFILES_BY_ROLE', defaultFlags.profilesByRole),
  profilesBySchool: getEnvFlag('VITE_FEATURE_PROFILES_BY_SCHOOL', defaultFlags.profilesBySchool),
  studentsByGrade: getEnvFlag('VITE_FEATURE_STUDENTS_BY_GRADE', defaultFlags.studentsByGrade),
  profileDeletion: getEnvFlag('VITE_FEATURE_PROFILE_DELETION', defaultFlags.profileDeletion),
  
  // Invite Management Features
  invitesByCreator: getEnvFlag('VITE_FEATURE_INVITES_BY_CREATOR', defaultFlags.invitesByCreator),
  invitesByEmail: getEnvFlag('VITE_FEATURE_INVITES_BY_EMAIL', defaultFlags.invitesByEmail),
  invitesByOrganization: getEnvFlag('VITE_FEATURE_INVITES_BY_ORG', defaultFlags.invitesByOrganization),
  inviteDeletion: getEnvFlag('VITE_FEATURE_INVITE_DELETION', defaultFlags.inviteDeletion),
  expiredInviteCleanup: getEnvFlag('VITE_FEATURE_EXPIRED_INVITE_CLEANUP', defaultFlags.expiredInviteCleanup),
  
  // Statistics & Analytics
  roleStatistics: getEnvFlag('VITE_FEATURE_ROLE_STATISTICS', defaultFlags.roleStatistics),
  userAnalytics: getEnvFlag('VITE_FEATURE_USER_ANALYTICS', defaultFlags.userAnalytics),
  
  // Dashboard Features
  studentDashboard: getEnvFlag('VITE_FEATURE_STUDENT_DASHBOARD', defaultFlags.studentDashboard),
  teacherDashboard: getEnvFlag('VITE_FEATURE_TEACHER_DASHBOARD', defaultFlags.teacherDashboard),
  adminDashboard: getEnvFlag('VITE_FEATURE_ADMIN_DASHBOARD', defaultFlags.adminDashboard),
  gamificationDashboard: getEnvFlag('VITE_FEATURE_GAMIFICATION_DASHBOARD', defaultFlags.gamificationDashboard),
  
  // Problem Features
  problemBank: getEnvFlag('VITE_FEATURE_PROBLEM_BANK', defaultFlags.problemBank),
  problemSets: getEnvFlag('VITE_FEATURE_PROBLEM_SETS', defaultFlags.problemSets),
  problemEditor: getEnvFlag('VITE_FEATURE_PROBLEM_EDITOR', defaultFlags.problemEditor),
  grading: getEnvFlag('VITE_FEATURE_GRADING', defaultFlags.grading),
  analytics: getEnvFlag('VITE_ENABLE_ANALYTICS', defaultFlags.analytics),
  
  // Problem Management Features - UseCase별 환경변수 제어
  problemList: getEnvFlag('VITE_FEATURE_PROBLEM_LIST', defaultFlags.problemList),
  problemDetail: getEnvFlag('VITE_FEATURE_PROBLEM_DETAIL', defaultFlags.problemDetail),
  problemSearch: getEnvFlag('VITE_FEATURE_PROBLEM_SEARCH', defaultFlags.problemSearch),
  problemCreation: getEnvFlag('VITE_FEATURE_PROBLEM_CREATION', defaultFlags.problemCreation),
  problemContentUpdate: getEnvFlag('VITE_FEATURE_PROBLEM_CONTENT_UPDATE', defaultFlags.problemContentUpdate),
  problemAnswerUpdate: getEnvFlag('VITE_FEATURE_PROBLEM_ANSWER_UPDATE', defaultFlags.problemAnswerUpdate),
  problemDifficultyChange: getEnvFlag('VITE_FEATURE_PROBLEM_DIFFICULTY_CHANGE', defaultFlags.problemDifficultyChange),
  problemTagManagement: getEnvFlag('VITE_FEATURE_PROBLEM_TAG_MANAGEMENT', defaultFlags.problemTagManagement),
  problemActivation: getEnvFlag('VITE_FEATURE_PROBLEM_ACTIVATION', defaultFlags.problemActivation),
  problemDeactivation: getEnvFlag('VITE_FEATURE_PROBLEM_DEACTIVATION', defaultFlags.problemDeactivation),
  problemDeletion: getEnvFlag('VITE_FEATURE_PROBLEM_DELETION', defaultFlags.problemDeletion),
  problemCloning: getEnvFlag('VITE_FEATURE_PROBLEM_CLONING', defaultFlags.problemCloning),
  
  // SRS Features
  srs: getEnvFlag('VITE_FEATURE_SRS', defaultFlags.srs),
  reviewSystem: getEnvFlag('VITE_FEATURE_REVIEW_SYSTEM', defaultFlags.reviewSystem),
  notifications: getEnvFlag('VITE_FEATURE_NOTIFICATIONS', defaultFlags.notifications),
  
  // Progress Features
  progressTracking: getEnvFlag('VITE_FEATURE_PROGRESS_TRACKING', defaultFlags.progressTracking),
  streakRankings: getEnvFlag('VITE_FEATURE_STREAK_RANKINGS', defaultFlags.streakRankings),
  classProgress: getEnvFlag('VITE_FEATURE_CLASS_PROGRESS', defaultFlags.classProgress),
  
  // Gamification Features
  tokenSystem: getEnvFlag('VITE_FEATURE_TOKENS', defaultFlags.tokenSystem),
  achievements: getEnvFlag('VITE_FEATURE_ACHIEVEMENTS', defaultFlags.achievements),
  leaderboards: getEnvFlag('VITE_FEATURE_LEADERBOARDS', defaultFlags.leaderboards),
  rewards: getEnvFlag('VITE_FEATURE_REWARDS', defaultFlags.rewards),
};

export const useFeature = (feature: keyof FeatureFlags): boolean => {
  return features[feature];
};