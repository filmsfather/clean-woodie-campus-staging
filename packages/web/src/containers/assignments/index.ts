/**
 * Assignment Containers Index
 * 
 * 모든 Assignment 관련 컨테이너를 중앙에서 관리하고 export
 * Container Pattern: 데이터 로직과 비즈니스 로직을 캡슐화하여 Presentational Components에 전달
 */

// Assignment Management Containers
export { default as AssignmentListContainer } from './AssignmentListContainer';
export { default as StudentAssignmentContainer } from './StudentAssignmentContainer';
export { default as AssignmentFormContainer } from './AssignmentFormContainer';

// Re-export types for convenience
export type { default as AssignmentListContainer } from './AssignmentListContainer';
export type { default as StudentAssignmentContainer } from './StudentAssignmentContainer';
export type { default as AssignmentFormContainer } from './AssignmentFormContainer';

/**
 * Container 사용 가이드
 * 
 * @example
 * // Teacher Assignment List
 * <AssignmentListContainer
 *   initialParams={{ status: 'ACTIVE', sortBy: 'dueDate' }}
 *   onAssignmentCreate={(assignment) => navigate(`/assignments/${assignment.id}`)}
 * >
 *   {(props) => <AssignmentListView {...props} />}
 * </AssignmentListContainer>
 * 
 * @example
 * // Student Assignment List
 * <StudentAssignmentContainer
 *   initialParams={{ status: 'ASSIGNED', sortBy: 'dueDate' }}
 *   onAssignmentStart={(id) => navigate(`/assignments/${id}/solve`)}
 * >
 *   {(props) => <StudentAssignmentView {...props} />}
 * </StudentAssignmentContainer>
 * 
 * @example
 * // Create Assignment Form
 * <AssignmentFormContainer
 *   onSuccess={(assignment) => {
 *     toast.success('Assignment created successfully!');
 *     navigate(`/assignments/${assignment.id}`);
 *   }}
 *   onError={(error) => toast.error(error)}
 * >
 *   {(props) => <AssignmentFormView {...props} />}
 * </AssignmentFormContainer>
 * 
 * @example
 * // Edit Assignment Form
 * <AssignmentFormContainer
 *   assignmentId="assignment-123"
 *   onSuccess={(assignment) => {
 *     toast.success('Assignment updated successfully!');
 *     navigate(`/assignments/${assignment.id}`);
 *   }}
 * >
 *   {(props) => <AssignmentFormView {...props} />}
 * </AssignmentFormContainer>
 */