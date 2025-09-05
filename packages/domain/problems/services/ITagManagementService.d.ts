import { Result } from '../../common/Result';
import { Tag } from '../value-objects/Tag';
export interface TagManagementOptions {
    maxSuggestions?: number;
    similarityThreshold?: number;
    maxRecommendations?: number;
    minWordLengthForAnalysis?: number;
    enableHierarchyAnalysis?: boolean;
    enableClustering?: boolean;
    caseSensitive?: boolean;
}
export interface ITagManagementService {
    findSimilarTags(inputTag: string, existingTags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    analyzeTagUsage(problemTags: Tag[][], options?: TagManagementOptions): Promise<Result<Array<{
        tag: Tag;
        count: number;
        percentage: number;
    }>>>;
    recommendTags(problemTitle: string, problemDescription: string, existingTags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    normalizeTagSet(tags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    searchTags(query: string, availableTags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    clusterSimilarTags(tags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[][]>>;
    analyzeTagHierarchy(tags: Tag[], options?: TagManagementOptions): Promise<Result<Map<string, Tag[]>>>;
}
export declare class TagManagementServiceAdapter implements ITagManagementService {
    findSimilarTags(inputTag: string, existingTags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    analyzeTagUsage(problemTags: Tag[][], options?: TagManagementOptions): Promise<Result<Array<{
        tag: Tag;
        count: number;
        percentage: number;
    }>>>;
    recommendTags(problemTitle: string, problemDescription: string, existingTags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    normalizeTagSet(tags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    searchTags(query: string, availableTags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[]>>;
    clusterSimilarTags(tags: Tag[], options?: TagManagementOptions): Promise<Result<Tag[][]>>;
    analyzeTagHierarchy(tags: Tag[], options?: TagManagementOptions): Promise<Result<Map<string, Tag[]>>>;
}
//# sourceMappingURL=ITagManagementService.d.ts.map