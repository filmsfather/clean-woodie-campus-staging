import { UniqueEntityID } from '@woodie/domain/common/Identifier';
export declare abstract class BaseRepository<T> {
    abstract findById(id: UniqueEntityID): Promise<T | null>;
    abstract save(entity: T): Promise<void>;
    abstract delete(id: UniqueEntityID): Promise<void>;
    protected constructor();
}
//# sourceMappingURL=BaseRepository.d.ts.map