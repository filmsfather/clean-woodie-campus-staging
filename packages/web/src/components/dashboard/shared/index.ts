// 대시보드 레이아웃 및 위젯 시스템
export { 
  DashboardLayout,
  getDashboardWidgets,
  useDashboardWidgets,
  WIDGET_REGISTRY,
  type DashboardWidget,
  type DashboardLayoutConfig
} from './DashboardLayout';

// 대시보드 설정 및 커스터마이징
export {
  DashboardSettingsModal,
  DashboardSettingsContext,
  useDashboardSettings,
  getDefaultDashboardSettings,
  type DashboardUserSettings
} from './DashboardSettings';

// 기존 공통 컴포넌트들
export { DashboardSkeleton } from './components/DashboardSkeleton';
export { DashboardError } from './components/DashboardError';

// 대시보드 데이터 타입들
export type {
  BaseWidgetData,
  StudentDashboardData,
  TeacherDashboardData,
  AdminDashboardData,
  DashboardData,
  DashboardState,
  WidgetState,
  DashboardAction,
  ChartDataPoint,
  TimeSeriesDataPoint,
  DashboardFilters,
  DashboardSortOptions,
  ExportOptions
} from '../../../types/dashboard';