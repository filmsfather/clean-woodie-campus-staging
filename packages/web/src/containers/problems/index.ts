/**
 * Problem Containers Index
 * 
 * 문제 관련 모든 컨테이너 컴포넌트를 중앙에서 관리하고 export
 * 컨테이너는 비즈니스 로직과 상태 관리를 담당하며, 순수한 UI 컴포넌트와 API 호출을 연결
 */

// Container 컴포넌트들
export { ProblemListContainer } from './ProblemListContainer';
export { ProblemSearchContainer } from './ProblemSearchContainer';
export { ProblemDetailContainer } from './ProblemDetailContainer';
export { ProblemFormContainer } from './ProblemFormContainer';

/**
 * Container 사용 가이드
 * 
 * @example
 * // 문제 목록 컨테이너
 * <ProblemListContainer
 *   initialFilter={{ includeInactive: false }}
 *   onProblemSelect={(problem) => navigate(`/problems/${problem.id}`)}
 *   onProblemEdit={(problemId) => navigate(`/problems/${problemId}/edit`)}
 *   showFilters={true}
 * />
 * 
 * @example
 * // 문제 검색 컨테이너
 * <ProblemSearchContainer
 *   initialSearchTerm="수학"
 *   onProblemSelect={(problem) => navigate(`/problems/${problem.id}`)}
 *   showAdvancedFilters={true}
 *   autoSearch={true}
 * />
 * 
 * @example
 * // 문제 상세 컨테이너
 * <ProblemDetailContainer
 *   problemId={params.problemId}
 *   onProblemUpdate={(problem) => console.log('Updated:', problem)}
 *   onBack={() => navigate(-1)}
 *   editable={canEdit}
 * />
 * 
 * @example
 * // 문제 생성 컨테이너
 * <ProblemFormContainer
 *   onProblemCreated={(problem) => navigate(`/problems/${problem.id}`)}
 *   onCancel={() => navigate(-1)}
 *   initialData={{ type: 'multiple-choice' }}
 * />
 */