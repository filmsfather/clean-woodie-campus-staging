import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
/**
 * 업적 정의 엔티티
 * 시스템에서 제공하는 업적의 정의를 나타냅니다
 */
export class Achievement extends Entity {
    get code() {
        return this.props.code;
    }
    get name() {
        return this.props.name;
    }
    get description() {
        return this.props.description;
    }
    get iconUrl() {
        return this.props.iconUrl;
    }
    get tokenReward() {
        return this.props.tokenReward;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    static create(props, id) {
        // 비즈니스 규칙 검증
        if (props.tokenReward.value < 0) {
            return Result.fail('Token reward cannot be negative');
        }
        if (props.tokenReward.value > 10000) {
            return Result.fail('Token reward cannot exceed 10,000');
        }
        // 아이콘 URL 검증 (선택사항)
        if (props.iconUrl && props.iconUrl.trim().length > 500) {
            return Result.fail('Icon URL cannot exceed 500 characters');
        }
        const achievement = new Achievement(props, id);
        return Result.ok(achievement);
    }
    /**
     * 업적을 비활성화합니다
     */
    deactivate() {
        this.props.isActive = false;
    }
    /**
     * 업적을 활성화합니다
     */
    activate() {
        this.props.isActive = true;
    }
    /**
     * 업적 정보를 업데이트합니다
     */
    update(updates) {
        if (updates.name) {
            this.props.name = updates.name;
        }
        if (updates.description) {
            this.props.description = updates.description;
        }
        if (updates.iconUrl !== undefined) {
            if (updates.iconUrl.trim().length > 500) {
                return Result.fail('Icon URL cannot exceed 500 characters');
            }
            this.props.iconUrl = updates.iconUrl.trim() || undefined;
        }
        if (updates.tokenReward) {
            if (updates.tokenReward.value < 0 || updates.tokenReward.value > 10000) {
                return Result.fail('Token reward must be between 0 and 10,000');
            }
            this.props.tokenReward = updates.tokenReward;
        }
        return Result.ok();
    }
    /**
     * 보상이 있는 업적인지 확인합니다
     */
    hasReward() {
        return this.props.tokenReward.value > 0;
    }
}
//# sourceMappingURL=Achievement.js.map