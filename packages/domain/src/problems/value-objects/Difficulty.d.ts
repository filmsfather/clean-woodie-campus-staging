import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
interface DifficultyProps {
    level: DifficultyLevel;
}
export declare class Difficulty extends ValueObject<DifficultyProps> {
    private constructor();
    get level(): DifficultyLevel;
    static isDifficultyLevel(value: number): value is DifficultyLevel;
    static create(level: number): Result<Difficulty>;
    private static createUnsafe;
    static veryEasy(): Difficulty;
    static easy(): Difficulty;
    static medium(): Difficulty;
    static hard(): Difficulty;
    static veryHard(): Difficulty;
    isEasierThan(other: Difficulty): boolean;
    isHarderThan(other: Difficulty): boolean;
    isSameDifficulty(other: Difficulty): boolean;
    toJSON(): {
        type: 'Difficulty';
        level: DifficultyLevel;
    };
    toString(): string;
    toPrimitive(): DifficultyLevel;
    static fromJSON(json: {
        level: DifficultyLevel;
    }): Result<Difficulty>;
    static fromString(value: string): Result<Difficulty>;
    static fromPrimitive(level: DifficultyLevel): Result<Difficulty>;
    static readonly LEVELS: {
        readonly VERY_EASY: 1;
        readonly EASY: 2;
        readonly MEDIUM: 3;
        readonly HARD: 4;
        readonly VERY_HARD: 5;
    };
}
export {};
//# sourceMappingURL=Difficulty.d.ts.map