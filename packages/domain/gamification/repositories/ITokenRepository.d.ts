import { Result } from '../../common/Result';
import { Token } from '../entities/Token';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { UniqueEntityID } from '../../common/Identifier';
export interface ITokenRepository {
    /**
     * 학생 ID로 토큰 정보 조회
     */
    findByStudentId(studentId: StudentId): Promise<Result<Token>>;
    /**
     * 토큰 ID로 조회
     */
    findById(id: UniqueEntityID): Promise<Result<Token>>;
    /**
     * 토큰 정보 저장 (생성 또는 업데이트)
     */
    save(token: Token): Promise<Result<void>>;
    /**
     * 토큰 삭제
     */
    delete(id: UniqueEntityID): Promise<Result<void>>;
    /**
     * 토큰 리더보드 조회 (총 획득량 기준)
     */
    getLeaderboardByTotalEarned(limit: number): Promise<Result<Token[]>>;
    /**
     * 토큰 리더보드 조회 (현재 잔액 기준)
     */
    getLeaderboardByBalance(limit: number): Promise<Result<Token[]>>;
}
//# sourceMappingURL=ITokenRepository.d.ts.map