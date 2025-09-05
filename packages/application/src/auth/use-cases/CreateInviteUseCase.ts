import { UseCase } from '../../use-cases/UseCase';
import { Result, Email, Invite, IInviteRepository, IAuthNotificationService } from '@woodie/domain';
import { CreateInviteDto, InviteDto } from '../dto/InviteDto';

export class CreateInviteUseCase implements UseCase<CreateInviteDto, InviteDto> {
  constructor(
    private inviteRepository: IInviteRepository,
    private notificationService: IAuthNotificationService
  ) {}

  async execute(dto: CreateInviteDto): Promise<Result<InviteDto>> {
    try {
      // 이메일 값 객체 생성
      const emailResult = Email.create(dto.email);
      if (emailResult.isFailure) {
        return Result.fail<InviteDto>(`Invalid email: ${emailResult.errorValue}`);
      }

      // 중복 초대 검증 (같은 조직에 활성 초대가 있는지 확인)
      const duplicateCheckResult = await this.inviteRepository.hasActivePendingInvite(
        emailResult.value, 
        dto.organizationId
      );
      
      if (duplicateCheckResult.isFailure) {
        return Result.fail<InviteDto>(`Failed to check duplicate invite: ${duplicateCheckResult.errorValue}`);
      }

      if (duplicateCheckResult.value) {
        return Result.fail<InviteDto>('An active invite already exists for this email in this organization');
      }

      // 초대 엔티티 생성
      const inviteResult = Invite.create({
        email: emailResult.value,
        role: dto.role,
        organizationId: dto.organizationId,
        classId: dto.classId,
        createdBy: dto.createdBy,
        expiryDays: dto.expiryDays
      });

      if (inviteResult.isFailure) {
        return Result.fail<InviteDto>(`Failed to create invite: ${inviteResult.errorValue}`);
      }

      // 리포지토리에 저장
      const savedInviteResult = await this.inviteRepository.save(inviteResult.value);
      if (savedInviteResult.isFailure) {
        return Result.fail<InviteDto>(`Failed to save invite: ${savedInviteResult.errorValue}`);
      }

      // 초대 이메일 발송 (사이드 이펙트)
      const invite = savedInviteResult.value;
      const notificationResult = await this.notificationService.notifyInviteCreated(invite);
      
      // 이메일 발송 실패해도 초대 생성은 성공으로 처리 (보상 트랜잭션으로 나중에 재시도 가능)
      if (notificationResult.isFailure) {
        // 로깅이나 모니터링 시스템에 기록 (실제 구현에서는 logger 주입)
        console.warn('Failed to send invite notification:', notificationResult.errorValue);
      }

      // DTO로 변환 후 반환
      const responseDto: InviteDto = {
        id: invite.id.toString(),
        email: invite.email.value,
        role: invite.role,
        organizationId: invite.organizationId,
        classId: invite.classId,
        token: invite.token.value,
        expiresAt: invite.expiresAt.toISOString(),
        usedAt: invite.usedAt?.toISOString(),
        createdBy: invite.createdBy,
        usedBy: invite.usedBy,
        createdAt: invite.createdAt.toISOString(),
        isExpired: invite.isExpired(),
        isUsed: invite.isUsed(),
        isValid: invite.isValid()
      };

      return Result.ok<InviteDto>(responseDto);

    } catch (error) {
      return Result.fail<InviteDto>(`Unexpected error creating invite: ${error}`);
    }
  }
}