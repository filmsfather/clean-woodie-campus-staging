import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { TokenAmount } from '../value-objects/TokenAmount';
import { TokenReason } from '../value-objects/TokenReason';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { IClock } from '../../srs/services/IClock';
export interface TokenProps {
    studentId: StudentId;
    balance: TokenAmount;
    totalEarned: TokenAmount;
    totalSpent: TokenAmount;
    updatedAt: Date;
}
export declare class Token extends AggregateRoot<TokenProps> {
    get studentId(): StudentId;
    get balance(): TokenAmount;
    get totalEarned(): TokenAmount;
    get totalSpent(): TokenAmount;
    get updatedAt(): Date;
    static create(props: TokenProps, id?: UniqueEntityID): Result<Token>;
    addTokens(amount: TokenAmount, reason: TokenReason, clock: IClock): Result<void>;
    spendTokens(amount: TokenAmount, reason: TokenReason, clock: IClock): Result<void>;
    canSpend(amount: TokenAmount): boolean;
}
//# sourceMappingURL=Token.d.ts.map