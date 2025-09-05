import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ClassId } from './ClassId';
import { StudentId } from './StudentId';
export declare enum AssignmentTargetType {
    CLASS = "CLASS",
    STUDENT = "STUDENT"
}
interface AssignmentTargetIdentifierProps {
    type: AssignmentTargetType;
    classId?: ClassId;
    studentId?: StudentId;
}
export declare class AssignmentTargetIdentifier extends ValueObject<AssignmentTargetIdentifierProps> {
    get type(): AssignmentTargetType;
    get classId(): ClassId | undefined;
    get studentId(): StudentId | undefined;
    private constructor();
    static createForClass(classId: ClassId): Result<AssignmentTargetIdentifier>;
    static createForStudent(studentId: StudentId): Result<AssignmentTargetIdentifier>;
    isClassTarget(): boolean;
    isStudentTarget(): boolean;
    getTargetId(): string;
    equals(other: AssignmentTargetIdentifier): boolean;
    toString(): string;
}
export {};
//# sourceMappingURL=AssignmentTargetIdentifier.d.ts.map