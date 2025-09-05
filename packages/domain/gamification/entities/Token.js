import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { TokenEarnedEvent } from '../events/TokenEarnedEvent';
import { TokenSpentEvent } from '../events/TokenSpentEvent';
export class Token extends AggregateRoot {
    get studentId() {
        return this.props.studentId;
    }
    get balance() {
        return this.props.balance;
    }
    get totalEarned() {
        return this.props.totalEarned;
    }
    get totalSpent() {
        return this.props.totalSpent;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(props, id) {
        // 비즈니스 규칙 검증
        if (props.balance.value < 0) {
            return Result.fail('Token balance cannot be negative');
        }
        if (props.totalEarned.value < props.totalSpent.value) {
            return Result.fail('Total earned cannot be less than total spent');
        }
        if (props.totalEarned.value - props.totalSpent.value !== props.balance.value) {
            return Result.fail('Balance must equal total earned minus total spent');
        }
        const token = new Token(props, id);
        return Result.ok(token);
    }
    addTokens(amount, reason, clock) {
        const newBalanceResult = this.props.balance.add(amount);
        if (newBalanceResult.isFailure) {
            return Result.fail(newBalanceResult.getErrorValue());
        }
        const newTotalEarnedResult = this.props.totalEarned.add(amount);
        if (newTotalEarnedResult.isFailure) {
            return Result.fail(newTotalEarnedResult.getErrorValue());
        }
        this.props.balance = newBalanceResult.getValue();
        this.props.totalEarned = newTotalEarnedResult.getValue();
        this.props.updatedAt = clock.now();
        // 토큰 획득 이벤트 발생
        const event = new TokenEarnedEvent(this.props.studentId, this.id, amount.value, reason.value, this.props.balance.value, this.props.totalEarned.value, this.props.updatedAt);
        this.addDomainEvent(event);
        return Result.ok();
    }
    spendTokens(amount, reason, clock) {
        if (!this.props.balance.isGreaterThanOrEqual(amount)) {
            return Result.fail('Insufficient token balance');
        }
        const newBalanceResult = this.props.balance.subtract(amount);
        if (newBalanceResult.isFailure) {
            return Result.fail(newBalanceResult.getErrorValue());
        }
        const newTotalSpentResult = this.props.totalSpent.add(amount);
        if (newTotalSpentResult.isFailure) {
            return Result.fail(newTotalSpentResult.getErrorValue());
        }
        this.props.balance = newBalanceResult.getValue();
        this.props.totalSpent = newTotalSpentResult.getValue();
        this.props.updatedAt = clock.now();
        // 토큰 사용 이벤트 발생
        const event = new TokenSpentEvent(this.props.studentId, this.id, amount.value, reason.value, this.props.balance.value, this.props.totalSpent.value, this.props.updatedAt);
        this.addDomainEvent(event);
        return Result.ok();
    }
    canSpend(amount) {
        return this.props.balance.isGreaterThanOrEqual(amount);
    }
}
//# sourceMappingURL=Token.js.map