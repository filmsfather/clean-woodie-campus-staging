import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  AssignToClassSchema,
  AssignToStudentSchema,
  ExtendDueDateSchema,
  ChangeDueDateSchema,
  RevokeAssignmentSchema,
  AssignmentQueryParamsSchema,
  StudentAssignmentQueryParamsSchema,
  TeacherAssignmentQueryParamsSchema,
  ClassAssignmentQueryParamsSchema,
  OverdueAssignmentQueryParamsSchema,
  DueSoonAssignmentQueryParamsSchema,
  ProcessOverdueAssignmentsSchema,
  AssignmentIdParamSchema,
  StudentIdParamSchema,
  ClassIdParamSchema,
  TeacherIdParamSchema
} from '../validation/AssignmentValidationSchemas';

export const validateCreateAssignment = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(CreateAssignmentSchema, req.body, req, res, next);
};

export const validateUpdateAssignment = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(UpdateAssignmentSchema, req.body, req, res, next);
};

export const validateAssignToClass = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(AssignToClassSchema, req.body, req, res, next);
};

export const validateAssignToStudent = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(AssignToStudentSchema, req.body, req, res, next);
};

export const validateExtendDueDate = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(ExtendDueDateSchema, req.body, req, res, next);
};

export const validateChangeDueDate = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(ChangeDueDateSchema, req.body, req, res, next);
};

export const validateRevokeAssignment = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(RevokeAssignmentSchema, req.body, req, res, next);
};

export const validateAssignmentQueryParams = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(AssignmentQueryParamsSchema, req.query, req, res, next, 'query');
};

export const validateStudentAssignmentQueryParams = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(StudentAssignmentQueryParamsSchema, req.query, req, res, next, 'query');
};

export const validateTeacherAssignmentQueryParams = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(TeacherAssignmentQueryParamsSchema, req.query, req, res, next, 'query');
};

export const validateClassAssignmentQueryParams = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(ClassAssignmentQueryParamsSchema, req.query, req, res, next, 'query');
};

export const validateOverdueAssignmentQueryParams = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(OverdueAssignmentQueryParamsSchema, req.query, req, res, next, 'query');
};

export const validateDueSoonAssignmentQueryParams = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(DueSoonAssignmentQueryParamsSchema, req.query, req, res, next, 'query');
};

export const validateProcessOverdueAssignments = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(ProcessOverdueAssignmentsSchema, req.query, req, res, next, 'query');
};

export const validateAssignmentIdParam = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(AssignmentIdParamSchema, req.params, req, res, next, 'params');
};

export const validateStudentIdParam = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(StudentIdParamSchema, req.params, req, res, next, 'params');
};

export const validateClassIdParam = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(ClassIdParamSchema, req.params, req, res, next, 'params');
};

export const validateTeacherIdParam = (req: Request, res: Response, next: NextFunction) => {
  validateSchema(TeacherIdParamSchema, req.params, req, res, next, 'params');
};

const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: any,
  req: Request,
  res: Response,
  next: NextFunction,
  dataType: 'body' | 'query' | 'params' = 'body'
): void => {
  try {
    const validatedData = schema.parse(data);
    
    // 검증된 데이터를 req 객체에 저장
    if (dataType === 'body') {
      req.body = validatedData;
    } else if (dataType === 'query') {
      req.query = validatedData as any;
    } else if (dataType === 'params') {
      req.params = validatedData as any;
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.received || data[err.path[0]]
          }))
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // 예상치 못한 에러
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal validation error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const validateDueDateNotPast = (req: Request, res: Response, next: NextFunction) => {
  const { dueDate } = req.body;
  
  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    
    if (dueDateObj <= now) {
      res.status(422).json({
        success: false,
        error: {
          code: 'INVALID_DUE_DATE',
          message: 'Due date must be in the future',
          details: {
            field: 'dueDate',
            message: 'Due date cannot be in the past',
            value: dueDate
          }
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
  }
  
  next();
};

export const validateTargetsProvided = (req: Request, res: Response, next: NextFunction) => {
  const { classIds, studentIds } = req.body;
  
  if ((!classIds || classIds.length === 0) && (!studentIds || studentIds.length === 0)) {
    res.status(422).json({
      success: false,
      error: {
        code: 'NO_TARGETS_PROVIDED',
        message: 'At least one class or student must be specified',
        details: {
          message: 'Either classIds or studentIds must contain at least one ID',
          classIds: classIds || [],
          studentIds: studentIds || []
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};