import { Result } from '../../common/Result';
import { Achievement } from '../entities/Achievement';
import { AchievementCode } from '../value-objects/AchievementCode';
import { UniqueEntityID } from '../../common/Identifier';
export interface IAchievementRepository {
    /**
     * 업적 코드로 조회
     */
    findByCode(code: AchievementCode): Promise<Result<Achievement>>;
    /**
     * 업적 ID로 조회
     */
    findById(id: UniqueEntityID): Promise<Result<Achievement>>;
    /**
     * 활성화된 모든 업적 조회
     */
    findAllActive(): Promise<Result<Achievement[]>>;
    /**
     * 업적 저장 (생성 또는 업데이트)
     */
    save(achievement: Achievement): Promise<Result<void>>;
    /**
     * 업적 삭제
     */
    delete(id: UniqueEntityID): Promise<Result<void>>;
    /**
     * 여러 업적을 코드로 조회
     */
    findByCodes(codes: AchievementCode[]): Promise<Result<Achievement[]>>;
}
//# sourceMappingURL=IAchievementRepository.d.ts.map