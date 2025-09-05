// API layer - Express server entry point
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createAuthRoutes } from './auth/routes';
import { AuthController } from './auth/AuthController';
import { mountSRSRoutes } from './srs/routes/ReviewRoutes';
import { ProblemUseCaseRoutes } from './problems/routes/ProblemUseCaseRoutes';
import { ProblemUseCaseController } from './problems/controllers/ProblemUseCaseController';
import { 
  AuthService,
  SignUpUseCase,
  SignInUseCase,
  SignOutUseCase,
  RefreshTokenUseCase,
  ResetPasswordUseCase,
  DeleteUserUseCase,
  FindUserByEmailUseCase,
  FindUserByInviteTokenUseCase
} from '@woodie/application';
// Use Case 구현체들 (Dependency Injection을 위해)
import { CreateProblemUseCase } from '@woodie/application/problems/use-cases/CreateProblemUseCase';
import { GetProblemUseCase } from '@woodie/application/problems/use-cases/GetProblemUseCase';
import { GetProblemListUseCase } from '@woodie/application/problems/use-cases/GetProblemListUseCase';
import { UpdateProblemContentUseCase } from '@woodie/application/problems/use-cases/UpdateProblemContentUseCase';
import { UpdateProblemAnswerUseCase } from '@woodie/application/problems/use-cases/UpdateProblemAnswerUseCase';
import { ChangeProblemDifficultyUseCase } from '@woodie/application/problems/use-cases/ChangeProblemDifficultyUseCase';
import { ManageProblemTagsUseCase } from '@woodie/application/problems/use-cases/ManageProblemTagsUseCase';
import { ActivateProblemUseCase } from '@woodie/application/problems/use-cases/ActivateProblemUseCase';
import { DeactivateProblemUseCase } from '@woodie/application/problems/use-cases/DeactivateProblemUseCase';
import { DeleteProblemUseCase } from '@woodie/application/problems/use-cases/DeleteProblemUseCase';
import { SearchProblemsUseCase } from '@woodie/application/problems/use-cases/SearchProblemsUseCase';
import { CloneProblemUseCase } from '@woodie/application/problems/use-cases/CloneProblemUseCase';
import { ProblemSearchService } from '@woodie/application/problems/services/ProblemSearchService';

// ProblemSet UseCase 구현체들
import {
  CreateProblemSetUseCase,
  GetProblemSetUseCase,
  GetProblemSetListUseCase,
  UpdateProblemSetUseCase,
  DeleteProblemSetUseCase,
  AddProblemToProblemSetUseCase,
  RemoveProblemFromProblemSetUseCase,
  ReorderProblemSetItemsUseCase
} from '@woodie/application';

// Assignment UseCase 구현체들
import {
  CreateAssignmentUseCase,
  UpdateAssignmentUseCase,
  DeleteAssignmentUseCase,
  ActivateAssignmentUseCase,
  DeactivateAssignmentUseCase,
  CloseAssignmentUseCase,
  ArchiveAssignmentUseCase,
  AssignToClassUseCase,
  AssignToStudentUseCase,
  RevokeAssignmentUseCase,
  ExtendDueDateUseCase,
  ChangeDueDateUseCase,
  GetAssignmentUseCase,
  GetAssignmentsForStudentUseCase,
  GetAssignmentsForClassUseCase,
  GetTeacherAssignmentsUseCase,
  GetOverdueAssignmentsUseCase,
  GetDueSoonAssignmentsUseCase,
  ProcessOverdueAssignmentsUseCase
} from '@woodie/application';

// Use Case 인터페이스들 (Clean Architecture Input Ports)
import {
  ICreateProblemUseCase,
  IGetProblemUseCase,
  IGetProblemListUseCase,
  IUpdateProblemContentUseCase,
  IUpdateProblemAnswerUseCase,
  IChangeProblemDifficultyUseCase,
  IManageProblemTagsUseCase,
  IActivateProblemUseCase,
  IDeactivateProblemUseCase,
  IDeleteProblemUseCase,
  ISearchProblemsUseCase,
  ICloneProblemUseCase
} from '@woodie/application/problems/interfaces/IProblemUseCases';

import { IProblemSearchService } from '@woodie/application/problems/interfaces/IProblemSearchService';

// ProblemSet 컨트롤러 및 라우트
import { ProblemSetController } from './problemsets/controllers/ProblemSetController';
import { ProblemSetRoutes } from './problemsets/routes/ProblemSetRoutes';

// Assignment 컨트롤러 및 라우트
import {
  AssignmentController,
  AssignmentTargetController,
  AssignmentQueryController,
  AssignmentJobController,
  AssignmentRouter
} from './assignments';
import { AssignmentJobRoutes } from './assignments/jobs/AssignmentJobRoutes';

import { 
  SupabaseAuthRepository,
  SupabaseUserRepository,
  SupabaseProblemRepository,
  SupabaseProblemSetRepository,
  SupabaseAssignmentRepository,
  AssignmentServiceFactory
} from '@woodie/infrastructure';
import { createClient } from '@supabase/supabase-js';

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Initialize repositories
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

const authRepository = new SupabaseAuthRepository(supabaseUrl, supabaseKey);
const userRepository = new SupabaseUserRepository(supabaseUrl, supabaseKey);
const problemRepository = new SupabaseProblemRepository(supabaseClient);
const problemSetRepository = new SupabaseProblemSetRepository(supabaseClient);

// Assignment Repository 및 Service 초기화
const assignmentRepository = new SupabaseAssignmentRepository(supabaseClient);
const assignmentService = AssignmentServiceFactory.create(supabaseClient);

// Initialize auth use cases
const signUpUseCase = new SignUpUseCase(userRepository, authRepository);
const signInUseCase = new SignInUseCase(authRepository);
const signOutUseCase = new SignOutUseCase(authRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(authRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const findUserByEmailUseCase = new FindUserByEmailUseCase(userRepository);
const findUserByInviteTokenUseCase = new FindUserByInviteTokenUseCase(userRepository);

// Initialize problem services (Domain Services) - TODO: logger와 cache service 추가 필요
const problemSearchService: IProblemSearchService = new ProblemSearchService(
  problemRepository,
  console as any, // 임시 logger
  undefined // cache service는 optional
);

// Initialize problem use cases (Application Services - 인터페이스에 할당하여 의존성 역전)
const createProblemUseCase: ICreateProblemUseCase = new CreateProblemUseCase(problemRepository);
const getProblemUseCase: IGetProblemUseCase = new GetProblemUseCase(problemRepository);
const getProblemListUseCase: IGetProblemListUseCase = new GetProblemListUseCase(problemRepository, problemSearchService);
const updateProblemContentUseCase: IUpdateProblemContentUseCase = new UpdateProblemContentUseCase(problemRepository);
const updateProblemAnswerUseCase: IUpdateProblemAnswerUseCase = new UpdateProblemAnswerUseCase(problemRepository);
const changeProblemDifficultyUseCase: IChangeProblemDifficultyUseCase = new ChangeProblemDifficultyUseCase(problemRepository);
const manageProblemTagsUseCase: IManageProblemTagsUseCase = new ManageProblemTagsUseCase(problemRepository);
const activateProblemUseCase: IActivateProblemUseCase = new ActivateProblemUseCase(problemRepository);
const deactivateProblemUseCase: IDeactivateProblemUseCase = new DeactivateProblemUseCase(problemRepository);
const deleteProblemUseCase: IDeleteProblemUseCase = new DeleteProblemUseCase(problemRepository);
const searchProblemsUseCase: ISearchProblemsUseCase = new SearchProblemsUseCase(problemSearchService);
const cloneProblemUseCase: ICloneProblemUseCase = new CloneProblemUseCase(problemRepository);

// ProblemSet UseCase들 초기화
const createProblemSetUseCase = new CreateProblemSetUseCase(problemSetRepository);
const getProblemSetUseCase = new GetProblemSetUseCase(problemSetRepository);
const getProblemSetListUseCase = new GetProblemSetListUseCase(problemSetRepository);
const updateProblemSetUseCase = new UpdateProblemSetUseCase(problemSetRepository, userRepository);
const deleteProblemSetUseCase = new DeleteProblemSetUseCase(problemSetRepository, userRepository);
const addProblemToProblemSetUseCase = new AddProblemToProblemSetUseCase(problemSetRepository, problemRepository, userRepository);
const removeProblemFromProblemSetUseCase = new RemoveProblemFromProblemSetUseCase(problemSetRepository, userRepository);
const reorderProblemSetItemsUseCase = new ReorderProblemSetItemsUseCase(problemSetRepository, userRepository);

// Assignment UseCase들 초기화
const createAssignmentUseCase = new CreateAssignmentUseCase(assignmentRepository, assignmentService);
const updateAssignmentUseCase = new UpdateAssignmentUseCase(assignmentRepository);
const deleteAssignmentUseCase = new DeleteAssignmentUseCase(assignmentRepository);
const activateAssignmentUseCase = new ActivateAssignmentUseCase(assignmentService);
const deactivateAssignmentUseCase = new DeactivateAssignmentUseCase(assignmentRepository);
const closeAssignmentUseCase = new CloseAssignmentUseCase(assignmentRepository);
const archiveAssignmentUseCase = new ArchiveAssignmentUseCase(assignmentRepository);
const assignToClassUseCase = new AssignToClassUseCase(assignmentService);
const assignToStudentUseCase = new AssignToStudentUseCase(assignmentService);
const revokeAssignmentUseCase = new RevokeAssignmentUseCase(assignmentService);
const extendDueDateUseCase = new ExtendDueDateUseCase(assignmentService);
const changeDueDateUseCase = new ChangeDueDateUseCase(assignmentService);
const getAssignmentUseCase = new GetAssignmentUseCase(assignmentRepository);
const getAssignmentsForStudentUseCase = new GetAssignmentsForStudentUseCase(assignmentService);
const getAssignmentsForClassUseCase = new GetAssignmentsForClassUseCase(assignmentService);
const getTeacherAssignmentsUseCase = new GetTeacherAssignmentsUseCase(assignmentRepository, assignmentService);
const getOverdueAssignmentsUseCase = new GetOverdueAssignmentsUseCase(assignmentService);
const getDueSoonAssignmentsUseCase = new GetDueSoonAssignmentsUseCase(assignmentService);
const processOverdueAssignmentsUseCase = new ProcessOverdueAssignmentsUseCase(assignmentService);

// Initialize auth service
const authService = new AuthService(
  signUpUseCase,
  signInUseCase,
  signOutUseCase,
  refreshTokenUseCase,
  resetPasswordUseCase,
  deleteUserUseCase,
  findUserByEmailUseCase,
  findUserByInviteTokenUseCase
);

// Initialize controllers
const authController = new AuthController(authService);
const problemUseCaseController = new ProblemUseCaseController(
  createProblemUseCase,
  getProblemUseCase,
  getProblemListUseCase,
  updateProblemContentUseCase,
  updateProblemAnswerUseCase,
  changeProblemDifficultyUseCase,
  manageProblemTagsUseCase,
  activateProblemUseCase,
  deactivateProblemUseCase,
  deleteProblemUseCase,
  searchProblemsUseCase,
  cloneProblemUseCase
);

const problemSetController = new ProblemSetController(
  createProblemSetUseCase,
  getProblemSetUseCase,
  getProblemSetListUseCase,
  updateProblemSetUseCase,
  deleteProblemSetUseCase,
  addProblemToProblemSetUseCase,
  removeProblemFromProblemSetUseCase,
  reorderProblemSetItemsUseCase
);

// Assignment Controllers 초기화
const assignmentController = new AssignmentController(
  createAssignmentUseCase,
  updateAssignmentUseCase,
  deleteAssignmentUseCase,
  activateAssignmentUseCase,
  deactivateAssignmentUseCase,
  closeAssignmentUseCase,
  archiveAssignmentUseCase
);

const assignmentTargetController = new AssignmentTargetController(
  assignToClassUseCase,
  assignToStudentUseCase,
  revokeAssignmentUseCase,
  extendDueDateUseCase,
  changeDueDateUseCase
);

const assignmentQueryController = new AssignmentQueryController(
  getAssignmentUseCase,
  getAssignmentsForStudentUseCase,
  getAssignmentsForClassUseCase,
  getTeacherAssignmentsUseCase,
  getOverdueAssignmentsUseCase,
  getDueSoonAssignmentsUseCase
);

const assignmentJobController = new AssignmentJobController(
  processOverdueAssignmentsUseCase
);

// Routes
app.use('/api/auth', createAuthRoutes(authController));

// Problem Use Case Routes
const problemUseCaseRoutes = new ProblemUseCaseRoutes(problemUseCaseController);
app.use('/api/problems/use-cases', problemUseCaseRoutes.getRouter());

// ProblemSet Routes
const problemSetRoutes = new ProblemSetRoutes(problemSetController);
app.use('/api/problemsets', problemSetRoutes.getRouter());

// Assignment Routes
const assignmentRouter = new AssignmentRouter(
  assignmentController,
  assignmentTargetController,
  assignmentQueryController
);
app.use('/api/assignments', assignmentRouter.getRouter());

// Assignment Job Routes (Admin only)
const assignmentJobRoutes = new AssignmentJobRoutes(assignmentJobController);
app.use('/api/assignments/jobs', assignmentJobRoutes.getRouter());

// SRS Routes
mountSRSRoutes(app);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`API server running on port ${port}`)
})

export default app