import { Request, Response } from 'express';
import { 
  CreateInviteUseCase, 
  ValidateInviteTokenUseCase, 
  UseInviteTokenUseCase,
  CreateInviteDto,
  ValidateInviteTokenDto,
  UseInviteTokenDto
} from '@woodie/application';

interface InviteRequest extends Request {
  body: {
    email?: string;
    role?: 'student' | 'teacher' | 'admin';
    organizationId?: string;
    classId?: string;
    token?: string;
    userId?: string;
    expiryDays?: number;
  };
  query: {
    token?: string;
  };
}

export class InviteController {
  constructor(
    private createInviteUseCase: CreateInviteUseCase,
    private validateInviteTokenUseCase: ValidateInviteTokenUseCase,
    private useInviteTokenUseCase: UseInviteTokenUseCase
  ) {}

  // POST /api/auth/invites - 새 초대 생성 (관리자만)
  async createInvite(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { email, role, organizationId, classId, expiryDays } = req.body;

      // 필수 필드 검증
      if (!email || !role || !organizationId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, role, organizationId'
        });
        return;
      }

      // 학생 초대시 클래스 ID 필수
      if (role === 'student' && !classId) {
        res.status(400).json({
          success: false,
          error: 'classId is required for student invites'
        });
        return;
      }

      // 교사/관리자는 클래스 ID 불허
      if ((role === 'teacher' || role === 'admin') && classId) {
        res.status(400).json({
          success: false,
          error: 'classId is not allowed for teacher and admin invites'
        });
        return;
      }

      // TODO: 현재 사용자가 관리자인지 검증 (JWT 토큰에서 추출)
      const createdBy = 'temp-admin-id'; // 실제로는 JWT에서 추출

      const createDto: CreateInviteDto = {
        email,
        role,
        organizationId,
        classId,
        createdBy,
        expiryDays
      };

      const result = await this.createInviteUseCase.execute(createDto);

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const invite = result.value;
      
      res.status(201).json({
        success: true,
        data: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          organizationId: invite.organizationId,
          classId: invite.classId,
          token: invite.token, // 프론트엔드에서 링크 생성용
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt
        }
      });

    } catch (error) {
      console.error('CreateInvite controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/auth/invites/validate?token=xxx - 초대 토큰 검증
  async validateInviteToken(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Missing token parameter'
        });
        return;
      }

      const validateDto: ValidateInviteTokenDto = {
        token: token as string
      };

      const result = await this.validateInviteTokenUseCase.execute(validateDto);

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const validation = result.value;

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: validation.errorMessage,
          data: { isValid: false }
        });
        return;
      }

      // 유효한 토큰인 경우 초대 정보 반환 (비밀 정보 제외)
      res.status(200).json({
        success: true,
        data: {
          isValid: true,
          invite: {
            email: validation.invite!.email,
            role: validation.invite!.role,
            organizationId: validation.invite!.organizationId,
            classId: validation.invite!.classId,
            expiresAt: validation.invite!.expiresAt
          }
        }
      });

    } catch (error) {
      console.error('ValidateInviteToken controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // POST /api/auth/invites/use - 초대 토큰 사용 (가입 완료 후 호출)
  async useInviteToken(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { token, userId } = req.body;

      if (!token || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: token, userId'
        });
        return;
      }

      const useDto: UseInviteTokenDto = {
        token,
        userId
      };

      const result = await this.useInviteTokenUseCase.execute(useDto);

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const usedInvite = result.value;

      res.status(200).json({
        success: true,
        data: {
          inviteUsed: true,
          usedAt: usedInvite.usedAt,
          message: 'Invite token successfully used'
        }
      });

    } catch (error) {
      console.error('UseInviteToken controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}