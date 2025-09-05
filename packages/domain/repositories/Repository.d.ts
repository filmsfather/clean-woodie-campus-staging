export interface Repository<T> {
    findById(id: string): Promise<T | null>;
    save(entity: T): Promise<void>;
    delete(entity: T): Promise<void>;
}
export interface SearchRepository<T> extends Repository<T> {
    findAll(): Promise<T[]>;
    findBy(criteria: any): Promise<T[]>;
    count(criteria?: any): Promise<number>;
}
export interface PaginatedRepository<T> extends SearchRepository<T> {
    findWithPagination(criteria: any, page: number, limit: number): Promise<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=Repository.d.ts.map