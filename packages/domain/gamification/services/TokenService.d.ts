import { Result } from '../../common/Result';
import { Token } from '../entities/Token';
import { TokenAmount } from '../value-objects/TokenAmount';
import { TokenReason } from '../value-objects/TokenReason';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { IClock } from '../../srs/services/IClock';
export declare class TokenService {
    private tokenRepository;
    private clock;
    constructor(tokenRepository: ITokenRepository, clock: IClock);
    /**
     * 학생에게 토큰을 지급합니다
     */
    awardTokens(studentId: StudentId, amount: TokenAmount, reason: TokenReason): Promise<Result<Token>>;
    /**
     * 학생의 토큰을 차감합니다
     */
    spendTokens(studentId: StudentId, amount: TokenAmount, reason: TokenReason): Promise<Result<Token>>;
    /**
     * 학생의 토큰 정보를 조회합니다
     */
    getTokenInfo(studentId: StudentId): Promise<Result<Token>>;
    /**
     * 토큰 잔액을 확인합니다
     */
    checkBalance(studentId: StudentId, requiredAmount: TokenAmount): Promise<Result<boolean>>;
    /**
     * 리더보드를 조회합니다
     */
    getLeaderboard(type: 'balance' | 'totalEarned', limit?: number): Promise<Result<Token[]>>;
}
//# sourceMappingURL=TokenService.d.ts.map