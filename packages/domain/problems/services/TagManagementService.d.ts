import { Result } from '../../common/Result';
import { Tag } from '../value-objects/Tag';
import { TagManagementOptions } from './ProblemManagementConfig';
export declare class TagManagementService {
    static findSimilarTags(inputTag: string, existingTags: Tag[], options?: TagManagementOptions): Tag[];
    private static calculateSimilarity;
    private static levenshteinDistance;
    static analyzeTagUsage(problemTags: Tag[][], options?: TagManagementOptions): Array<{
        tag: Tag;
        count: number;
        percentage: number;
    }>;
    static analyzeTagHierarchy(tags: Tag[], options?: TagManagementOptions): Map<string, Tag[]>;
    static clusterSimilarTags(tags: Tag[], options?: TagManagementOptions): Tag[][];
    static recommendTags(problemTitle: string, problemDescription: string, existingTags: Tag[], options?: TagManagementOptions): Tag[];
    static normalizeTagSet(tags: Tag[], options?: TagManagementOptions): Result<Tag[]>;
    static searchTags(query: string, availableTags: Tag[], options?: TagManagementOptions): Tag[];
    static getTagStatistics(problemTags: Tag[][]): {
        totalUniqueTags: number;
        averageTagsPerProblem: number;
        mostUsedTag: {
            tag: string;
            count: number;
        } | null;
        tagDistribution: Array<{
            tag: string;
            count: number;
            percentage: number;
        }>;
    };
}
export declare class ConfigurableTagManagementService {
    private options;
    constructor(options?: TagManagementOptions);
    updateOptions(newOptions: Partial<TagManagementOptions>): void;
    getOptions(): TagManagementOptions;
    findSimilarTags(input: string, tags: Tag[]): Tag[];
    analyzeTagUsage(problemTags: Tag[][]): Array<{
        tag: Tag;
        count: number;
        percentage: number;
    }>;
    recommendTags(title: string, description: string, existingTags: Tag[]): Tag[];
    normalizeTagSet(tags: Tag[]): Result<Tag[]>;
    searchTags(query: string, availableTags: Tag[]): Tag[];
    clusterSimilarTags(tags: Tag[]): Tag[][];
    analyzeTagHierarchy(tags: Tag[]): Map<string, Tag[]>;
}
//# sourceMappingURL=TagManagementService.d.ts.map