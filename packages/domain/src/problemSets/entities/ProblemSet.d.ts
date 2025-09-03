import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { ProblemSetTitle } from '../value-objects/ProblemSetTitle';
import { ProblemSetDescription } from '../value-objects/ProblemSetDescription';
import { ProblemSetItem } from './ProblemSetItem';
interface ProblemSetProps {
    teacherId: string;
    title: ProblemSetTitle;
    description?: ProblemSetDescription;
    items?: ProblemSetItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class ProblemSet extends AggregateRoot<UniqueEntityID> {
    private _teacherId;
    private _title;
    private _description?;
    private _items;
    private _createdAt;
    private _updatedAt;
    constructor(props: ProblemSetProps, id?: UniqueEntityID);
    get teacherId(): string;
    get title(): ProblemSetTitle;
    get description(): ProblemSetDescription | undefined;
    get items(): ProblemSetItem[];
    get itemCount(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    addProblem(problemId: UniqueEntityID, orderIndex?: number): Result<void>;
    removeProblem(problemId: UniqueEntityID): Result<void>;
    reorderProblems(orderedProblemIds: UniqueEntityID[]): Result<void>;
    updateTitle(title: ProblemSetTitle): void;
    updateDescription(description: ProblemSetDescription): void;
    clearDescription(): void;
    isEmpty(): boolean;
    containsProblem(problemId: UniqueEntityID): boolean;
    getProblemPosition(problemId: UniqueEntityID): number;
    getProblemIds(): UniqueEntityID[];
    getOrderedItems(): ProblemSetItem[];
    isOwnedBy(teacherId: string): boolean;
    canAddMoreProblems(maxProblemsPerSet?: number): boolean;
    static create(props: Omit<ProblemSetProps, 'items'>, id?: UniqueEntityID): Result<ProblemSet>;
    static createWithItems(props: ProblemSetProps, id?: UniqueEntityID): Result<ProblemSet>;
}
export {};
//# sourceMappingURL=ProblemSet.d.ts.map