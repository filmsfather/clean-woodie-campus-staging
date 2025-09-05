import { Request, Response } from 'express';
import { 
  CreateInviteUseCase, 
  ValidateInviteTokenUseCase, 
  UseInviteTokenUseCase,
  DeleteInviteUseCase,
  FindInvitesByEmailUseCase,
  FindPendingInvitesByEmailUseCase,
  FindInvitesByCreatorUseCase,
  FindInvitesByOrganizationUseCase,
  DeleteExpiredInvitesUseCase,
  CheckActivePendingInviteUseCase,
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
    creatorId?: string;
    olderThanDays?: number;
    requesterId?: string;
  };
  params: {
    inviteId?: string;
    creatorId?: string;
    organizationId?: string;
  };
  query: {
    token?: string;
    email?: string;
    organizationId?: string;
    creatorId?: string;
    role?: 'student' | 'teacher' | 'admin';
    isUsed?: string;
    isExpired?: string;
  };
}

export class InviteController {
  constructor(
    private createInviteUseCase: CreateInviteUseCase,
    private validateInviteTokenUseCase: ValidateInviteTokenUseCase,
    private useInviteTokenUseCase: UseInviteTokenUseCase,
    private deleteInviteUseCase: DeleteInviteUseCase,
    private findInvitesByEmailUseCase: FindInvitesByEmailUseCase,
    private findPendingInvitesByEmailUseCase: FindPendingInvitesByEmailUseCase,
    private findInvitesByCreatorUseCase: FindInvitesByCreatorUseCase,
    private findInvitesByOrganizationUseCase: FindInvitesByOrganizationUseCase,
    private deleteExpiredInvitesUseCase: DeleteExpiredInvitesUseCase,
    private checkActivePendingInviteUseCase: CheckActivePendingInviteUseCase
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

  // DELETE /api/auth/invites/:inviteId - 초대 삭제 (관리자만)
  async deleteInvite(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { inviteId } = req.params;
      const { requesterId } = req.body;

      if (!inviteId) {
        res.status(400).json({
          success: false,
          error: 'Missing inviteId parameter'
        });
        return;
      }

      const result = await this.deleteInviteUseCase.execute({
        inviteId,
        requesterId
      });

      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? 404 : 400;
        
        res.status(statusCode).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Invite deleted successfully'
      });

    } catch (error) {
      console.error('DeleteInvite controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/auth/invites/by-email?email=xxx - 이메일별 초대 조회
  async findInvitesByEmail(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Missing email parameter'
        });
        return;
      }

      const result = await this.findInvitesByEmailUseCase.execute({
        email: email as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const invites = result.value;
      
      res.status(200).json({
        success: true,
        data: invites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          organizationId: invite.organizationId,
          classId: invite.classId,
          token: invite.token, // 관리자용, 실제로는 권한 체크 필요
          expiresAt: invite.expiresAt,
          usedAt: invite.usedAt,
          createdBy: invite.createdBy,
          usedBy: invite.usedBy,
          createdAt: invite.createdAt
        }))
      });

    } catch (error) {
      console.error('FindInvitesByEmail controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/auth/invites/pending?email=xxx - 대기중인 초대 조회
  async findPendingInvitesByEmail(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Missing email parameter'
        });
        return;
      }

      const result = await this.findPendingInvitesByEmailUseCase.execute({
        email: email as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const invites = result.value;
      
      res.status(200).json({
        success: true,
        data: invites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          organizationId: invite.organizationId,
          classId: invite.classId,
          expiresAt: invite.expiresAt,
          createdBy: invite.createdBy,
          createdAt: invite.createdAt
        }))
      });

    } catch (error) {
      console.error('FindPendingInvitesByEmail controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/auth/invites/by-creator/:creatorId - 생성자별 초대 조회
  async findInvitesByCreator(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { creatorId } = req.params;

      if (!creatorId) {
        res.status(400).json({
          success: false,
          error: 'Missing creatorId parameter'
        });
        return;
      }

      const result = await this.findInvitesByCreatorUseCase.execute({
        creatorId
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const invites = result.value;
      
      res.status(200).json({
        success: true,
        data: invites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          organizationId: invite.organizationId,
          classId: invite.classId,
          expiresAt: invite.expiresAt,
          usedAt: invite.usedAt,
          usedBy: invite.usedBy,
          createdAt: invite.createdAt
        }))
      });

    } catch (error) {
      console.error('FindInvitesByCreator controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/auth/invites/by-organization/:organizationId - 조직별 초대 조회
  async findInvitesByOrganization(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { creatorId, role, isUsed, isExpired } = req.query;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: 'Missing organizationId parameter'
        });
        return;
      }

      // 필터 구성
      const filters: any = {};
      if (creatorId) filters.createdBy = creatorId as string;
      if (role) filters.role = role as 'student' | 'teacher' | 'admin';
      if (isUsed !== undefined) filters.isUsed = isUsed === 'true';
      if (isExpired !== undefined) filters.isExpired = isExpired === 'true';

      const result = await this.findInvitesByOrganizationUseCase.execute({
        organizationId,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const invites = result.value;
      
      res.status(200).json({
        success: true,
        data: invites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          organizationId: invite.organizationId,
          classId: invite.classId,
          expiresAt: invite.expiresAt,
          usedAt: invite.usedAt,
          createdBy: invite.createdBy,
          usedBy: invite.usedBy,
          createdAt: invite.createdAt
        }))
      });

    } catch (error) {
      console.error('FindInvitesByOrganization controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // DELETE /api/auth/invites/expired - 만료된 토큰 삭제 (관리자만)
  async deleteExpiredInvites(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { olderThanDays } = req.body;

      const result = await this.deleteExpiredInvitesUseCase.execute({
        olderThanDays
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const deletedCount = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          deletedCount,
          message: `${deletedCount} expired invites deleted`
        }
      });

    } catch (error) {
      console.error('DeleteExpiredInvites controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/auth/invites/check-active?email=xxx&organizationId=xxx - 활성 초대 확인
  async checkActivePendingInvite(req: InviteRequest, res: Response): Promise<void> {
    try {
      const { email, organizationId } = req.query;

      if (!email || !organizationId) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: email, organizationId'
        });
        return;
      }

      const result = await this.checkActivePendingInviteUseCase.execute({
        email: email as string,
        organizationId: organizationId as string
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.errorValue
        });
        return;
      }

      const hasActivePendingInvite = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          hasActivePendingInvite,
          message: hasActivePendingInvite 
            ? 'User has active pending invite for this organization'
            : 'No active pending invite found'
        }
      });

    } catch (error) {
      console.error('CheckActivePendingInvite controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}