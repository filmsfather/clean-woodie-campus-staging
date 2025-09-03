import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { ProblemType } from '../value-objects/ProblemType';
import { ProblemContent } from '../value-objects/ProblemContent';
import { AnswerContent } from '../value-objects/AnswerContent';
import { Difficulty } from '../value-objects/Difficulty';
import { Tag } from '../value-objects/Tag';
interface ProblemProps {
    teacherId: string;
    content: ProblemContent;
    correctAnswer: AnswerContent;
    difficulty: Difficulty;
    tags: Tag[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Problem extends AggregateRoot<ProblemProps> {
    private constructor();
    get teacherId(): string;
    get content(): ProblemContent;
    get correctAnswer(): AnswerContent;
    get type(): ProblemType;
    get difficulty(): Difficulty;
    get tags(): Tag[];
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateContent(newContent: ProblemContent): Result<void>;
    updateCorrectAnswer(newAnswer: AnswerContent): Result<void>;
    changeDifficulty(newDifficulty: Difficulty): Result<void>;
    addTag(tag: Tag): Result<void>;
    removeTag(tagName: string): Result<void>;
    updateTags(newTags: Tag[]): Result<void>;
    activate(): Result<void>;
    deactivate(): Result<void>;
    isOwnedBy(teacherId: string): boolean;
    clone(newTeacherId?: string): Result<Problem>;
    validateForUse(): Result<void>;
    getSearchMetadata(): {
        id: string;
        teacherId: string;
        type: string;
        difficulty: number;
        tags: string[];
        title: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    static create(props: {
        teacherId: string;
        content: ProblemContent;
        correctAnswer: AnswerContent;
        difficulty: Difficulty;
        tags?: Tag[];
    }, id?: UniqueEntityID): Result<Problem>;
    static restore(props: {
        id: string;
        teacherId: string;
        content: ProblemContent;
        correctAnswer: AnswerContent;
        difficulty: Difficulty;
        tags: Tag[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Result<Problem>;
    toPersistence(): {
        id: string;
        teacherId: string;
        content: any;
        correctAnswer: any;
        difficulty: number;
        tags: string[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}
export {};
//# sourceMappingURL=Problem.d.ts.map