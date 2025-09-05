import { Request, Response } from 'express';
import { 
  CreateProfileUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
  ChangeRoleUseCase,
  DeleteProfileUseCase,
  FindProfileByEmailUseCase,
  FindProfilesBySchoolUseCase,
  FindProfilesByRoleUseCase,
  FindStudentsByGradeUseCase,
  CheckEmailExistsUseCase,
  CheckUserExistsUseCase,
  GetRoleStatisticsUseCase,
  CreateProfileDto,
  GetProfileDto,
  UpdateProfileDto,
  ChangeRoleDto
} from '@woodie/application';

interface ProfileRequest extends Request {
  body: {
    userId?: string;
    email?: string;
    fullName?: string;
    role?: 'student' | 'teacher' | 'admin';
    schoolId?: string;
    gradeLevel?: number;
    avatarUrl?: string;
    settings?: any;
    targetUserId?: string;
    newRole?: 'student' | 'teacher' | 'admin';
    requesterId?: string;
  };
  params: {
    userId?: string;
    schoolId?: string;
  };
  query: {
    email?: string;
    role?: 'student' | 'teacher' | 'admin';
    gradeLevel?: string;
    schoolId?: string;
  };
}

export class ProfileController {
  constructor(
    private createProfileUseCase: CreateProfileUseCase,
    private getProfileUseCase: GetProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
    private changeRoleUseCase: ChangeRoleUseCase,
    private deleteProfileUseCase: DeleteProfileUseCase,
    private findProfileByEmailUseCase: FindProfileByEmailUseCase,
    private findProfilesBySchoolUseCase: FindProfilesBySchoolUseCase,
    private findProfilesByRoleUseCase: FindProfilesByRoleUseCase,
    private findStudentsByGradeUseCase: FindStudentsByGradeUseCase,
    private checkEmailExistsUseCase: CheckEmailExistsUseCase,
    private checkUserExistsUseCase: CheckUserExistsUseCase,
    private getRoleStatisticsUseCase: GetRoleStatisticsUseCase
  ) {}

  // POST /api/profiles - 새 프로필 생성 (회원가입 시)
  async createProfile(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { email, fullName, role, schoolId, gradeLevel } = req.body;

      // 필수 필드 검증
      if (!email || !fullName || !role) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, fullName, role'
        });
        return;
      }

      // TODO: JWT에서 userId 추출 (현재는 임시)
      const userId = req.body.userId || 'temp-user-id';

      const createDto: CreateProfileDto = {
        userId,
        email,
        fullName,
        role,
        schoolId,
        gradeLevel
      };

      const result = await this.createProfileUseCase.execute(createDto);

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const profile = result.value;
      
      res.status(201).json({
        success: true,
        data: profile
      });

    } catch (error) {
      console.error('CreateProfile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/:userId - 프로필 조회
  async getProfile(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing userId parameter'
        });
        return;
      }

      const getDto: GetProfileDto = {
        userId
      };

      const result = await this.getProfileUseCase.execute(getDto);

      if (result.isFailure) {
        const errorMessage = result.errorValue;
        const statusCode = errorMessage.includes('not found') ? 404 : 400;
        
        res.status(statusCode).json({
          success: false,
          error: errorMessage
        });
        return;
      }

      const profile = result.value;
      
      res.status(200).json({
        success: true,
        data: profile
      });

    } catch (error) {
      console.error('GetProfile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // PUT /api/profiles/:userId - 프로필 업데이트
  async updateProfile(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { fullName, gradeLevel, avatarUrl, settings } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing userId parameter'
        });
        return;
      }

      // TODO: 현재 사용자가 본인 프로필 또는 관리자 권한 확인
      const updateDto: UpdateProfileDto = {
        userId,
        fullName,
        gradeLevel,
        avatarUrl,
        settings
      };

      const result = await this.updateProfileUseCase.execute(updateDto);

      if (result.isFailure) {
        const errorMessage = result.errorValue;
        const statusCode = errorMessage.includes('not found') ? 404 : 400;
        
        res.status(statusCode).json({
          success: false,
          error: errorMessage
        });
        return;
      }

      const profile = result.value;
      
      res.status(200).json({
        success: true,
        data: profile
      });

    } catch (error) {
      console.error('UpdateProfile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // PATCH /api/profiles/:userId/role - 역할 변경 (관리자만)
  async changeRole(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { userId: targetUserId } = req.params;
      const { newRole } = req.body;

      if (!targetUserId || !newRole) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: targetUserId, newRole'
        });
        return;
      }

      // 유효한 역할인지 확인
      if (!['student', 'teacher', 'admin'].includes(newRole)) {
        res.status(400).json({
          success: false,
          error: 'Invalid role. Must be student, teacher, or admin'
        });
        return;
      }

      // TODO: JWT에서 현재 사용자 ID 추출
      const userId = req.body.userId || 'temp-admin-id';

      const changeRoleDto: ChangeRoleDto = {
        userId, // 현재 사용자 (관리자)
        targetUserId, // 역할을 변경할 사용자
        newRole
      };

      const result = await this.changeRoleUseCase.execute(changeRoleDto);

      if (result.isFailure) {
        const errorMessage = result.errorValue;
        let statusCode = 400;
        
        if (errorMessage.includes('not found')) {
          statusCode = 404;
        } else if (errorMessage.includes('Only admins')) {
          statusCode = 403;
        }
        
        res.status(statusCode).json({
          success: false,
          error: errorMessage
        });
        return;
      }

      const profile = result.value;
      
      res.status(200).json({
        success: true,
        data: profile,
        message: `User role changed to ${newRole}`
      });

    } catch (error) {
      console.error('ChangeRole controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/me - 현재 사용자 프로필 조회 (편의 메서드)
  async getMyProfile(req: ProfileRequest, res: Response): Promise<void> {
    try {
      // TODO: JWT에서 현재 사용자 ID 추출
      const userId = req.body.userId || 'temp-user-id';

      req.params.userId = userId;
      await this.getProfile(req, res);

    } catch (error) {
      console.error('GetMyProfile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // PUT /api/profiles/me - 현재 사용자 프로필 업데이트 (편의 메서드)
  async updateMyProfile(req: ProfileRequest, res: Response): Promise<void> {
    try {
      // TODO: JWT에서 현재 사용자 ID 추출
      const userId = req.body.userId || 'temp-user-id';

      req.params.userId = userId;
      await this.updateProfile(req, res);

    } catch (error) {
      console.error('UpdateMyProfile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // DELETE /api/profiles/:userId - 프로필 삭제
  async deleteProfile(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { requesterId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing userId parameter'
        });
        return;
      }

      const result = await this.deleteProfileUseCase.execute({
        userId,
        requesterId
      });

      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? 404 :
                          result.errorValue.includes('Only admins') ? 403 : 400;
        
        res.status(statusCode).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully'
      });

    } catch (error) {
      console.error('DeleteProfile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/by-email?email=xxx - 이메일로 프로필 찾기
  async findProfileByEmail(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Missing email parameter'
        });
        return;
      }

      const result = await this.findProfileByEmailUseCase.execute({
        email: email as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const profile = result.value;
      
      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile
      });

    } catch (error) {
      console.error('FindProfileByEmail controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/by-school/:schoolId - 학교별 프로필 조회
  async findProfilesBySchool(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { schoolId } = req.params;
      const { role, gradeLevel } = req.query;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          error: 'Missing schoolId parameter'
        });
        return;
      }

      // 필터 구성
      const filters: any = {};
      if (role) filters.role = role as 'student' | 'teacher' | 'admin';
      if (gradeLevel) filters.gradeLevel = parseInt(gradeLevel as string);

      const result = await this.findProfilesBySchoolUseCase.execute({
        schoolId,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const profiles = result.value;
      
      res.status(200).json({
        success: true,
        data: profiles
      });

    } catch (error) {
      console.error('FindProfilesBySchool controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/by-role?role=xxx - 역할별 프로필 조회
  async findProfilesByRole(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { role } = req.query;

      if (!role) {
        res.status(400).json({
          success: false,
          error: 'Missing role parameter'
        });
        return;
      }

      const result = await this.findProfilesByRoleUseCase.execute({
        role: role as 'student' | 'teacher' | 'admin'
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const profiles = result.value;
      
      res.status(200).json({
        success: true,
        data: profiles
      });

    } catch (error) {
      console.error('FindProfilesByRole controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/students/by-grade?gradeLevel=x&schoolId=xxx - 학년별 학생 조회
  async findStudentsByGrade(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { gradeLevel, schoolId } = req.query;

      if (!gradeLevel) {
        res.status(400).json({
          success: false,
          error: 'Missing gradeLevel parameter'
        });
        return;
      }

      const gradeLevelNum = parseInt(gradeLevel as string);
      if (isNaN(gradeLevelNum) || gradeLevelNum < 1) {
        res.status(400).json({
          success: false,
          error: 'Grade level must be a valid positive number'
        });
        return;
      }

      const result = await this.findStudentsByGradeUseCase.execute({
        gradeLevel: gradeLevelNum,
        schoolId: schoolId as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const profiles = result.value;
      
      res.status(200).json({
        success: true,
        data: profiles
      });

    } catch (error) {
      console.error('FindStudentsByGrade controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/check-email?email=xxx - 이메일 존재 확인
  async checkEmailExists(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Missing email parameter'
        });
        return;
      }

      const result = await this.checkEmailExistsUseCase.execute({
        email: email as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const exists = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          exists,
          message: exists ? 'Email already exists' : 'Email is available'
        }
      });

    } catch (error) {
      console.error('CheckEmailExists controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/:userId/exists - 사용자 존재 확인
  async checkUserExists(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing userId parameter'
        });
        return;
      }

      const result = await this.checkUserExistsUseCase.execute({
        userId
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const exists = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          exists,
          message: exists ? 'User exists' : 'User does not exist'
        }
      });

    } catch (error) {
      console.error('CheckUserExists controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/profiles/statistics/roles?schoolId=xxx - 역할별 통계
  async getRoleStatistics(req: ProfileRequest, res: Response): Promise<void> {
    try {
      const { schoolId } = req.query;

      const result = await this.getRoleStatisticsUseCase.execute({
        schoolId: schoolId as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const statistics = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          statistics,
          total: statistics.students + statistics.teachers + statistics.admins
        }
      });

    } catch (error) {
      console.error('GetRoleStatistics controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}