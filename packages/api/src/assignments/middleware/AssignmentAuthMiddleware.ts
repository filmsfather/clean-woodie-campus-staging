import { Request, Response, NextFunction } from 'express';

export const requireTeacher = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (user.role !== 'teacher' && user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only teachers and admins can perform this action'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only admins can perform this action'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

export const requireAssignmentOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const assignmentId = req.params.id;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (user.role === 'admin') {
    next();
    return;
  }
  
  if (user.role !== 'teacher') {
    res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only teachers and admins can access assignments'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // TODO: 실제 구현에서는 assignment repository를 통해 소유권 확인
  // 현재는 teacherId를 req에 추가하여 컨트롤러에서 확인하도록 함
  (req as any).requesterId = user.id;
  next();
};

export const requireStudentAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const studentId = req.params.studentId;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // 관리자는 모든 학생 정보에 접근 가능
  if (user.role === 'admin') {
    next();
    return;
  }
  
  // 교사는 자신이 담당하는 학생들의 정보에 접근 가능 (실제로는 클래스 관계 확인 필요)
  if (user.role === 'teacher') {
    // TODO: 실제 구현에서는 교사-학생 관계 확인 필요
    next();
    return;
  }
  
  // 학생은 자신의 정보만 접근 가능
  if (user.role === 'student' && user.id === studentId) {
    next();
    return;
  }
  
  res.status(403).json({
    success: false,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Access denied to student assignments'
    },
    timestamp: new Date().toISOString()
  });
};

export const requireClassAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const classId = req.params.classId;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // 관리자는 모든 클래스에 접근 가능
  if (user.role === 'admin') {
    next();
    return;
  }
  
  // 교사는 자신이 담당하는 클래스에만 접근 가능
  if (user.role === 'teacher') {
    // TODO: 실제 구현에서는 교사-클래스 관계 확인 필요
    next();
    return;
  }
  
  // 학생은 자신이 속한 클래스에만 접근 가능
  if (user.role === 'student') {
    // TODO: 실제 구현에서는 학생-클래스 관계 확인 필요
    next();
    return;
  }
  
  res.status(403).json({
    success: false,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Access denied to class assignments'
    },
    timestamp: new Date().toISOString()
  });
};

export const requireTeacherAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const teacherId = req.params.teacherId;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // 관리자는 모든 교사 정보에 접근 가능
  if (user.role === 'admin') {
    next();
    return;
  }
  
  // 교사는 자신의 정보만 접근 가능
  if (user.role === 'teacher' && user.id === teacherId) {
    next();
    return;
  }
  
  res.status(403).json({
    success: false,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Access denied to teacher assignments'
    },
    timestamp: new Date().toISOString()
  });
};