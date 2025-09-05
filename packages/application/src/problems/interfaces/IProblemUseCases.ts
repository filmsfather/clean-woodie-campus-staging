// Problem Use Case Interfaces (Input Ports)
import { Result } from '@woodie/domain/common/Result';

// === Input DTOs ===
export interface CreateProblemInput {
  teacherId: string;
  title: string;
  description?: string;
  type: string;
  correctAnswerValue: string;
  difficultyLevel: number;
  tags?: string[];
}

export interface GetProblemInput {
  problemId: string;
  requesterId?: string;
}

export interface UpdateProblemContentInput {
  problemId: string;
  teacherId: string;
  title: string;
  description?: string;
}

export interface UpdateProblemAnswerInput {
  problemId: string;
  teacherId: string;
  correctAnswerValue: string;
}

export interface ChangeProblemDifficultyInput {
  problemId: string;
  teacherId: string;
  difficultyLevel: number;
}

export interface ManageProblemTagsInput {
  problemId: string;
  teacherId: string;
  operation: 'add' | 'remove' | 'update';
  tagNames: string[];
}

export interface ActivateProblemInput {
  problemId: string;
  teacherId: string;
}

export interface DeactivateProblemInput {
  problemId: string;
  teacherId: string;
}

export interface DeleteProblemInput {
  problemId: string;
  teacherId: string;
  hardDelete?: boolean;
}

export interface SearchProblemsInput {
  searchTerm?: string;
  tags?: string[];
  difficultyLevel?: number;
  difficultyRange?: { min: number; max: number };
  teacherId?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
}

export interface CloneProblemInput {
  sourceProblemId: string;
  newTeacherId: string;
  requesterId: string;
}

export interface GetProblemListInput {
  teacherId?: string;
  includeInactive?: boolean;
  tags?: string[];
  difficultyRange?: { min: number; max: number };
  page?: number;
  limit?: number;
}

// === Output DTOs ===
export interface ProblemOutput {
  id: string;
  teacherId: string;
  title: string;
  description?: string; // Optional to match ProblemDto
  type: string;
  difficulty: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProblemOutput {
  problem: ProblemOutput;
}

export interface GetProblemListOutput {
  problems: ProblemOutput[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface SearchProblemsOutput {
  problems: ProblemOutput[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
  searchMetadata: {
    searchTerm?: string;
    appliedFilters: string[];
    searchDurationMs: number;
  };
}

// === Use Case Interfaces (Input Ports) ===
export interface ICreateProblemUseCase {
  execute(input: CreateProblemInput): Promise<Result<CreateProblemOutput>>;
}

export interface IGetProblemUseCase {
  execute(input: GetProblemInput): Promise<Result<ProblemOutput>>;
}

export interface IGetProblemListUseCase {
  execute(input: GetProblemListInput): Promise<Result<GetProblemListOutput>>;
}

export interface IUpdateProblemContentUseCase {
  execute(input: UpdateProblemContentInput): Promise<Result<ProblemOutput>>;
}

export interface IUpdateProblemAnswerUseCase {
  execute(input: UpdateProblemAnswerInput): Promise<Result<ProblemOutput>>;
}

export interface IChangeProblemDifficultyUseCase {
  execute(input: ChangeProblemDifficultyInput): Promise<Result<ProblemOutput>>;
}

export interface IManageProblemTagsUseCase {
  execute(input: ManageProblemTagsInput): Promise<Result<ProblemOutput>>;
}

export interface IActivateProblemUseCase {
  execute(input: ActivateProblemInput): Promise<Result<ProblemOutput>>;
}

export interface IDeactivateProblemUseCase {
  execute(input: DeactivateProblemInput): Promise<Result<ProblemOutput>>;
}

export interface IDeleteProblemUseCase {
  execute(input: DeleteProblemInput): Promise<Result<void>>;
}

export interface ISearchProblemsUseCase {
  execute(input: SearchProblemsInput): Promise<Result<SearchProblemsOutput>>;
}

export interface CloneProblemOutput {
  originalProblem: ProblemOutput;
  clonedProblem: ProblemOutput;
}

export interface ICloneProblemUseCase {
  execute(input: CloneProblemInput): Promise<Result<CloneProblemOutput>>;
}