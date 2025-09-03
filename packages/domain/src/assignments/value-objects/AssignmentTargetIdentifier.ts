import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ClassId } from './ClassId';
import { StudentId } from './StudentId';

// 배정 대상 타입 열거형
export enum AssignmentTargetType {
  CLASS = 'CLASS',
  STUDENT = 'STUDENT'
}

// 배정 대상 식별자의 속성
interface AssignmentTargetIdentifierProps {
  type: AssignmentTargetType;
  classId?: ClassId;
  studentId?: StudentId;
}

// 타입 안전한 배정 대상 식별자 값 객체
export class AssignmentTargetIdentifier extends ValueObject<AssignmentTargetIdentifierProps> {
  get type(): AssignmentTargetType {
    return this.props.type;
  }

  get classId(): ClassId | undefined {
    return this.props.classId;
  }

  get studentId(): StudentId | undefined {
    return this.props.studentId;
  }

  private constructor(props: AssignmentTargetIdentifierProps) {
    super(props);
  }

  // 반 대상 식별자 생성
  public static createForClass(classId: ClassId): Result<AssignmentTargetIdentifier> {
    return Result.ok<AssignmentTargetIdentifier>(
      new AssignmentTargetIdentifier({
        type: AssignmentTargetType.CLASS,
        classId
      })
    );
  }

  // 학생 대상 식별자 생성
  public static createForStudent(studentId: StudentId): Result<AssignmentTargetIdentifier> {
    return Result.ok<AssignmentTargetIdentifier>(
      new AssignmentTargetIdentifier({
        type: AssignmentTargetType.STUDENT,
        studentId
      })
    );
  }

  // 쿼리 메서드들
  public isClassTarget(): boolean {
    return this.props.type === AssignmentTargetType.CLASS;
  }

  public isStudentTarget(): boolean {
    return this.props.type === AssignmentTargetType.STUDENT;
  }

  public getTargetId(): string {
    if (this.isClassTarget() && this.props.classId) {
      return this.props.classId.value;
    }
    if (this.isStudentTarget() && this.props.studentId) {
      return this.props.studentId.value;
    }
    throw new Error('Invalid target identifier state');
  }

  public equals(other: AssignmentTargetIdentifier): boolean {
    if (!other || !other.props) {
      return false;
    }

    if (this.props.type !== other.props.type) {
      return false;
    }

    if (this.isClassTarget()) {
      return this.props.classId?.equals(other.props.classId!) ?? false;
    }

    if (this.isStudentTarget()) {
      return this.props.studentId?.equals(other.props.studentId!) ?? false;
    }

    return false;
  }

  public toString(): string {
    return `${this.props.type}:${this.getTargetId()}`;
  }
}