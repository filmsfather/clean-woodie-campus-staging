import { Request, Response } from 'express';
import { 
  CreateProfileUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
  ChangeRoleUseCase,
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
  };
  params: {
    userId?: string;
  };
}

export class ProfileController {
  constructor(
    private createProfileUseCase: CreateProfileUseCase,
    private getProfileUseCase: GetProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
    private changeRoleUseCase: ChangeRoleUseCase
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
}