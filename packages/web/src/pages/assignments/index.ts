/**
 * Assignment Pages Index
 * 
 * 모든 Assignment 관련 페이지를 중앙에서 관리하고 export
 * React Router에서 사용할 수 있도록 페이지 컴포넌트들을 제공
 */

// Assignment Management Pages
export { default as AssignmentsPage } from './AssignmentsPage';
export { default as CreateAssignmentPage } from './CreateAssignmentPage';
export { default as AssignmentDetailPage } from './AssignmentDetailPage';

// Re-export for type checking
export type { default as AssignmentsPage } from './AssignmentsPage';
export type { default as CreateAssignmentPage } from './CreateAssignmentPage';
export type { default as AssignmentDetailPage } from './AssignmentDetailPage';

/**
 * Page 라우팅 가이드
 * 
 * @example
 * // React Router 설정
 * import { 
 *   AssignmentsPage, 
 *   CreateAssignmentPage, 
 *   AssignmentDetailPage 
 * } from './pages/assignments';
 * 
 * const routes = [
 *   {
 *     path: "/assignments",
 *     element: <AssignmentsPage />
 *   },
 *   {
 *     path: "/assignments/create",
 *     element: <CreateAssignmentPage />
 *   },
 *   {
 *     path: "/assignments/:assignmentId",
 *     element: <AssignmentDetailPage />
 *   },
 *   {
 *     path: "/assignments/:assignmentId/edit",
 *     element: <EditAssignmentPage /> // TODO: Create this page
 *   }
 * ];
 * 
 * @example
 * // Dashboard Navigation
 * <nav>
 *   <Link to="/assignments">My Assignments</Link>
 *   <Link to="/assignments/create">Create Assignment</Link>
 * </nav>
 * 
 * @example
 * // Programmatic Navigation
 * const navigate = useNavigate();
 * 
 * const handleAssignmentCreated = (assignment) => {
 *   navigate(`/assignments/${assignment.id}`);
 * };
 */