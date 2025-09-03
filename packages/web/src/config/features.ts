/**
 * Feature Flag 설정
 * 각 UseCase별 UI 표면 노출 제어
 */

export interface FeatureFlags {
  // Auth Features
  signUp: boolean;
  signIn: boolean;
  profile: boolean;
  inviteSystem: boolean;
  roleManagement: boolean;
  
  // Dashboard Features  
  studentDashboard: boolean;
  teacherDashboard: boolean;
  adminDashboard: boolean;
  gamificationDashboard: boolean;
  
  // Problem Features
  problemBank: boolean;
  problemSets: boolean;
  problemEditor: boolean;
  grading: boolean;
  analytics: boolean;
  
  // SRS Features
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
      signUp: false,
      signIn: true,
      profile: true,
      inviteSystem: false,
      roleManagement: false,
      studentDashboard: true,
      teacherDashboard: true,
      adminDashboard: false,
      gamificationDashboard: false,
      problemBank: true,
      problemSets: true,
      problemEditor: false,
      grading: true,
      analytics: false,
      reviewSystem: false,
      notifications: true,
      progressTracking: true,
      streakRankings: false,
      classProgress: false,
      tokenSystem: false,
      achievements: false,
      leaderboards: false,
      rewards: false,
    };
  }
  
  // 개발/스테이징 환경 기본값
  return {
    signUp: true,
    signIn: true,
    profile: true,
    inviteSystem: true,
    roleManagement: true,
    studentDashboard: true,
    teacherDashboard: true,
    adminDashboard: true,
    gamificationDashboard: true,
    problemBank: true,
    problemSets: true,
    problemEditor: true,
    grading: true,
    analytics: true,
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
  // Auth Features - 환경 변수에서 override 가능
  signUp: getEnvFlag('VITE_FEATURE_SIGNUP', defaultFlags.signUp),
  signIn: getEnvFlag('VITE_FEATURE_SIGNIN', defaultFlags.signIn),
  profile: getEnvFlag('VITE_FEATURE_PROFILE', defaultFlags.profile),
  inviteSystem: getEnvFlag('VITE_FEATURE_INVITE_SYSTEM', defaultFlags.inviteSystem),
  roleManagement: getEnvFlag('VITE_FEATURE_ROLE_MANAGEMENT', defaultFlags.roleManagement),
  
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
  
  // SRS Features - 새로 구현된 기능들
  reviewSystem: getEnvFlag('VITE_FEATURE_REVIEW_SYSTEM', defaultFlags.reviewSystem),
  notifications: getEnvFlag('VITE_FEATURE_NOTIFICATIONS', defaultFlags.notifications),
  
  // Progress Features - 새로 구현된 기능들
  progressTracking: getEnvFlag('VITE_FEATURE_PROGRESS_TRACKING', defaultFlags.progressTracking),
  streakRankings: getEnvFlag('VITE_FEATURE_STREAK_RANKINGS', defaultFlags.streakRankings),
  classProgress: getEnvFlag('VITE_FEATURE_CLASS_PROGRESS', defaultFlags.classProgress),
  
  // Gamification Features - 새로 구현된 기능들
  tokenSystem: getEnvFlag('VITE_FEATURE_TOKENS', defaultFlags.tokenSystem),
  achievements: getEnvFlag('VITE_FEATURE_ACHIEVEMENTS', defaultFlags.achievements),
  leaderboards: getEnvFlag('VITE_FEATURE_LEADERBOARDS', defaultFlags.leaderboards),
  rewards: getEnvFlag('VITE_FEATURE_REWARDS', defaultFlags.rewards),
};

export const useFeature = (feature: keyof FeatureFlags): boolean => {
  return features[feature];
};