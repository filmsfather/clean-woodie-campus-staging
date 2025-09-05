import { z } from 'zod';

export const CreateAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required').trim(),
  problemSetId: z.string().min(1, 'Problem set ID is required').trim(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  description: z.string().max(1000, 'Description too long').trim().optional(),
  dueDate: z.string().datetime('Invalid due date format'),
  timezone: z.string().optional(),
  maxAttempts: z.number().int().positive().max(100).optional(),
  classIds: z.array(z.string().min(1)).optional(),
  studentIds: z.array(z.string().min(1)).optional()
}).refine(data => {
  return (data.classIds && data.classIds.length > 0) || 
         (data.studentIds && data.studentIds.length > 0) || 
         (!data.classIds && !data.studentIds);
}, {
  message: 'At least one class or student must be specified if providing targets'
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
  description: z.string().max(1000, 'Description too long').trim().optional(),
  dueDate: z.string().datetime('Invalid due date format').optional(),
  timezone: z.string().optional(),
  maxAttempts: z.number().int().positive().max(100).optional()
});

export const AssignToClassSchema = z.object({
  classIds: z.array(z.string().min(1, 'Class ID cannot be empty')).min(1, 'At least one class ID is required')
});

export const AssignToStudentSchema = z.object({
  studentIds: z.array(z.string().min(1, 'Student ID cannot be empty')).min(1, 'At least one student ID is required')
});

export const ExtendDueDateSchema = z.object({
  extensionDays: z.number().int().positive().max(365, 'Extension cannot exceed 365 days'),
  reason: z.string().max(500, 'Reason too long').trim().optional(),
  targetType: z.enum(['all', 'class', 'student']),
  targetIds: z.array(z.string().min(1)).optional()
}).refine(data => {
  if (data.targetType !== 'all' && (!data.targetIds || data.targetIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Target IDs are required when target type is not "all"'
});

export const ChangeDueDateSchema = z.object({
  newDueDate: z.string().datetime('Invalid due date format'),
  reason: z.string().max(500, 'Reason too long').trim().optional()
});

export const RevokeAssignmentSchema = z.object({
  targetType: z.enum(['class', 'student']),
  targetIds: z.array(z.string().min(1, 'Target ID cannot be empty')).min(1, 'At least one target ID is required'),
  reason: z.string().max(500, 'Reason too long').trim().optional()
});

export const AssignmentQueryParamsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  includeCompleted: z.string().optional().transform(val => val === 'true'),
  includePastDue: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['createdAt', 'dueDate', 'title', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const StudentAssignmentQueryParamsSchema = z.object({
  includeCompleted: z.string().optional().transform(val => val === 'true'),
  includePastDue: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20)
});

export const TeacherAssignmentQueryParamsSchema = z.object({
  includeArchived: z.string().optional().transform(val => val === 'true'),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  sortBy: z.enum(['createdAt', 'dueDate', 'title', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const ClassAssignmentQueryParamsSchema = z.object({
  includeCompleted: z.string().optional().transform(val => val === 'true'),
  includePastDue: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20)
});

export const OverdueAssignmentQueryParamsSchema = z.object({
  daysPastDue: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  teacherId: z.string().optional(),
  classId: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20)
});

export const DueSoonAssignmentQueryParamsSchema = z.object({
  hoursAhead: z.string().optional().transform(val => val ? parseInt(val, 10) : 48),
  teacherId: z.string().optional(),
  classId: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20)
});

export const ProcessOverdueAssignmentsSchema = z.object({
  dryRun: z.string().optional().transform(val => val === 'true'),
  maxDaysPastDue: z.string().optional().transform(val => val ? parseInt(val, 10) : 30),
  sendNotifications: z.string().optional().transform(val => val !== 'false')
});

export const AssignmentIdParamSchema = z.object({
  id: z.string().min(1, 'Assignment ID is required')
});

export const StudentIdParamSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required')
});

export const ClassIdParamSchema = z.object({
  classId: z.string().min(1, 'Class ID is required')
});

export const TeacherIdParamSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required')
});