/**
 * Problem Pages Index
 * 
 * 문제 관련 모든 페이지 컴포넌트를 중앙에서 관리하고 export
 */

// Page 컴포넌트들
export { ProblemsPage } from './ProblemsPage';
export { ProblemDetailPage } from './ProblemDetailPage';
export { CreateProblemPage } from './CreateProblemPage';
export { EditProblemPage } from './EditProblemPage';

/**
 * 라우팅 가이드
 * 
 * 다음과 같은 라우트 구조를 권장합니다:
 * 
 * @example
 * // 라우터 설정 예시
 * <Routes>
 *   <Route path="/problems" element={<ProblemsPage />} />
 *   <Route path="/problems/create" element={<CreateProblemPage />} />
 *   <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
 *   <Route path="/problems/:problemId/edit" element={<EditProblemPage />} />
 * </Routes>
 * 
 * URL 구조:
 * - /problems - 문제 목록/검색 페이지 
 * - /problems/create - 새 문제 생성 페이지
 * - /problems/:problemId - 문제 상세 보기 페이지
 * - /problems/:problemId/edit - 문제 편집 페이지
 */