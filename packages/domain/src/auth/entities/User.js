import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
export class User extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    get email() {
        return this.props.email;
    }
    get name() {
        return this.props.name;
    }
    get role() {
        return this.props.role;
    }
    get classId() {
        return this.props.classId;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(props, id) {
        const emailResult = Email.create(props.email);
        if (emailResult.isFailure) {
            return Result.fail(emailResult.error);
        }
        if (!props.name || props.name.trim().length === 0) {
            return Result.fail('Name cannot be empty');
        }
        if (props.name.trim().length > 100) {
            return Result.fail('Name is too long');
        }
        const now = new Date();
        const user = new User({
            email: emailResult.value,
            name: props.name.trim(),
            role: props.role,
            classId: props.classId,
            isActive: props.isActive ?? true,
            createdAt: now,
            updatedAt: now
        }, id);
        return Result.ok(user);
    }
    updateProfile(name, classId) {
        if (name !== undefined) {
            if (!name || name.trim().length === 0) {
                return Result.fail('Name cannot be empty');
            }
            if (name.trim().length > 100) {
                return Result.fail('Name is too long');
            }
            this.props.name = name.trim();
        }
        if (classId !== undefined) {
            this.props.classId = classId;
        }
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
}
//# sourceMappingURL=User.js.map