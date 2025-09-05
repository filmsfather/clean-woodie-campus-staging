import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
// 배정 대상 타입 열거형
export var AssignmentTargetType;
(function (AssignmentTargetType) {
    AssignmentTargetType["CLASS"] = "CLASS";
    AssignmentTargetType["STUDENT"] = "STUDENT";
})(AssignmentTargetType || (AssignmentTargetType = {}));
// 타입 안전한 배정 대상 식별자 값 객체
export class AssignmentTargetIdentifier extends ValueObject {
    get type() {
        return this.props.type;
    }
    get classId() {
        return this.props.classId;
    }
    get studentId() {
        return this.props.studentId;
    }
    constructor(props) {
        super(props);
    }
    // 반 대상 식별자 생성
    static createForClass(classId) {
        return Result.ok(new AssignmentTargetIdentifier({
            type: AssignmentTargetType.CLASS,
            classId
        }));
    }
    // 학생 대상 식별자 생성
    static createForStudent(studentId) {
        return Result.ok(new AssignmentTargetIdentifier({
            type: AssignmentTargetType.STUDENT,
            studentId
        }));
    }
    // 쿼리 메서드들
    isClassTarget() {
        return this.props.type === AssignmentTargetType.CLASS;
    }
    isStudentTarget() {
        return this.props.type === AssignmentTargetType.STUDENT;
    }
    getTargetId() {
        if (this.isClassTarget() && this.props.classId) {
            return this.props.classId.value;
        }
        if (this.isStudentTarget() && this.props.studentId) {
            return this.props.studentId.value;
        }
        throw new Error('Invalid target identifier state');
    }
    equals(other) {
        if (!other || !other.props) {
            return false;
        }
        if (this.props.type !== other.props.type) {
            return false;
        }
        if (this.isClassTarget()) {
            return this.props.classId?.equals(other.props.classId) ?? false;
        }
        if (this.isStudentTarget()) {
            return this.props.studentId?.equals(other.props.studentId) ?? false;
        }
        return false;
    }
    toString() {
        return `${this.props.type}:${this.getTargetId()}`;
    }
}
//# sourceMappingURL=AssignmentTargetIdentifier.js.map