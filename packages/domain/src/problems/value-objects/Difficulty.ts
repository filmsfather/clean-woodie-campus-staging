import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

// 1-5 단계 난이도
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

const DIFFICULTY_LEVELS = {
  VERY_EASY: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  VERY_HARD: 5
} as const;

interface DifficultyProps {
  level: DifficultyLevel;
}

export class Difficulty extends ValueObject<DifficultyProps> {
  private constructor(props: DifficultyProps) {
    super(props);
  }

  get level(): DifficultyLevel {
    return this.props.level;
  }

  // 타입 가드
  public static isDifficultyLevel(value: number): value is DifficultyLevel {
    return Number.isInteger(value) && value >= 1 && value <= 5;
  }

  // 주 생성자
  public static create(level: number): Result<Difficulty> {
    if (!this.isDifficultyLevel(level)) {
      return Result.fail<Difficulty>(`Invalid difficulty level: ${level}. Must be integer between 1 and 5`);
    }

    return Result.ok<Difficulty>(new Difficulty({ level }));
  }

  // 안전한 내부 생성자
  private static createUnsafe(level: DifficultyLevel): Difficulty {
    return new Difficulty({ level });
  }

  // 편의 생성자들
  public static veryEasy(): Difficulty {
    return this.createUnsafe(DIFFICULTY_LEVELS.VERY_EASY);
  }

  public static easy(): Difficulty {
    return this.createUnsafe(DIFFICULTY_LEVELS.EASY);
  }

  public static medium(): Difficulty {
    return this.createUnsafe(DIFFICULTY_LEVELS.MEDIUM);
  }

  public static hard(): Difficulty {
    return this.createUnsafe(DIFFICULTY_LEVELS.HARD);
  }

  public static veryHard(): Difficulty {
    return this.createUnsafe(DIFFICULTY_LEVELS.VERY_HARD);
  }

  // 비교 메서드
  public isEasierThan(other: Difficulty): boolean {
    return this.props.level < other.props.level;
  }

  public isHarderThan(other: Difficulty): boolean {
    return this.props.level > other.props.level;
  }

  public isSameDifficulty(other: Difficulty): boolean {
    return this.props.level === other.props.level;
  }

  // 직렬화/역직렬화
  public toJSON(): { type: 'Difficulty'; level: DifficultyLevel } {
    return {
      type: 'Difficulty',
      level: this.props.level
    };
  }

  public toString(): string {
    return this.props.level.toString();
  }

  public toPrimitive(): DifficultyLevel {
    return this.props.level;
  }

  public static fromJSON(json: { level: DifficultyLevel }): Result<Difficulty> {
    return this.create(json.level);
  }

  public static fromString(value: string): Result<Difficulty> {
    const numValue = parseInt(value, 10);
    return this.create(numValue);
  }

  public static fromPrimitive(level: DifficultyLevel): Result<Difficulty> {
    return this.create(level);
  }

  // 상수 접근
  public static readonly LEVELS = DIFFICULTY_LEVELS;
}