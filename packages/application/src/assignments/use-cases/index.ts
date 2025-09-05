// Assignment Creation & Management
export { CreateAssignmentUseCase } from './CreateAssignmentUseCase';
export type { CreateAssignmentInput, CreateAssignmentOutput } from './CreateAssignmentUseCase';

export { UpdateAssignmentUseCase } from './UpdateAssignmentUseCase';
export type { UpdateAssignmentInput, UpdateAssignmentOutput } from './UpdateAssignmentUseCase';

export { DeleteAssignmentUseCase } from './DeleteAssignmentUseCase';
export type { DeleteAssignmentInput, DeleteAssignmentOutput } from './DeleteAssignmentUseCase';

// Assignment Status Management
export { ActivateAssignmentUseCase } from './ActivateAssignmentUseCase';
export type { ActivateAssignmentInput, ActivateAssignmentOutput } from './ActivateAssignmentUseCase';

export { DeactivateAssignmentUseCase } from './DeactivateAssignmentUseCase';
export type { DeactivateAssignmentInput, DeactivateAssignmentOutput } from './DeactivateAssignmentUseCase';

export { CloseAssignmentUseCase } from './CloseAssignmentUseCase';
export type { CloseAssignmentInput, CloseAssignmentOutput } from './CloseAssignmentUseCase';

export { ArchiveAssignmentUseCase } from './ArchiveAssignmentUseCase';
export type { ArchiveAssignmentInput, ArchiveAssignmentOutput } from './ArchiveAssignmentUseCase';

// Assignment Target Management
export { AssignToClassUseCase } from './AssignToClassUseCase';
export type { AssignToClassInput, AssignToClassOutput } from './AssignToClassUseCase';

export { AssignToStudentUseCase } from './AssignToStudentUseCase';
export type { AssignToStudentInput, AssignToStudentOutput } from './AssignToStudentUseCase';

export { RevokeAssignmentUseCase } from './RevokeAssignmentUseCase';
export type { RevokeAssignmentInput, RevokeAssignmentOutput } from './RevokeAssignmentUseCase';

// Due Date Management
export { ExtendDueDateUseCase } from './ExtendDueDateUseCase';
export type { ExtendDueDateInput, ExtendDueDateOutput } from './ExtendDueDateUseCase';

export { ChangeDueDateUseCase } from './ChangeDueDateUseCase';
export type { ChangeDueDateInput, ChangeDueDateOutput } from './ChangeDueDateUseCase';

// Assignment Queries
export { GetAssignmentUseCase } from './GetAssignmentUseCase';
export type { GetAssignmentInput, AssignmentDetailOutput } from './GetAssignmentUseCase';

export { GetAssignmentsForStudentUseCase } from './GetAssignmentsForStudentUseCase';
export type { 
  GetAssignmentsForStudentInput, 
  GetAssignmentsForStudentOutput,
  StudentAssignmentSummary 
} from './GetAssignmentsForStudentUseCase';

export { GetAssignmentsForClassUseCase } from './GetAssignmentsForClassUseCase';
export type { 
  GetAssignmentsForClassInput, 
  GetAssignmentsForClassOutput,
  ClassAssignmentSummary 
} from './GetAssignmentsForClassUseCase';

export { GetTeacherAssignmentsUseCase } from './GetTeacherAssignmentsUseCase';
export type { 
  GetTeacherAssignmentsInput, 
  GetTeacherAssignmentsOutput,
  TeacherAssignmentSummary 
} from './GetTeacherAssignmentsUseCase';

// Due Date Related Queries & Processing
export { GetOverdueAssignmentsUseCase } from './GetOverdueAssignmentsUseCase';
export type { 
  GetOverdueAssignmentsInput, 
  GetOverdueAssignmentsOutput,
  OverdueAssignmentSummary 
} from './GetOverdueAssignmentsUseCase';

export { GetDueSoonAssignmentsUseCase } from './GetDueSoonAssignmentsUseCase';
export type { 
  GetDueSoonAssignmentsInput, 
  GetDueSoonAssignmentsOutput,
  DueSoonAssignmentSummary 
} from './GetDueSoonAssignmentsUseCase';

export { ProcessOverdueAssignmentsUseCase } from './ProcessOverdueAssignmentsUseCase';
export type { 
  ProcessOverdueAssignmentsInput, 
  ProcessOverdueAssignmentsOutput,
  ProcessedAssignmentSummary 
} from './ProcessOverdueAssignmentsUseCase';