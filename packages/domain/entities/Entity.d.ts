import { UniqueEntityID } from '../common/Identifier';
export declare abstract class Entity<T> {
    protected readonly _id: UniqueEntityID;
    protected props: T;
    constructor(props: T, id?: UniqueEntityID);
    get id(): UniqueEntityID;
    equals(entity: Entity<T>): boolean;
}
//# sourceMappingURL=Entity.d.ts.map