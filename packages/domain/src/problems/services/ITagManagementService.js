import { Result } from '../../common/Result';
// 기본 구현체 어댑터 (Static → Instance 변환)
export class TagManagementServiceAdapter {
    async findSimilarTags(inputTag, existingTags, options) {
        try {
            // 동적 import로 순환 의존성 방지
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.findSimilarTags(inputTag, existingTags, options);
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Failed to find similar tags: ${error}`);
        }
    }
    async analyzeTagUsage(problemTags, options) {
        try {
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.analyzeTagUsage(problemTags, options);
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Failed to analyze tag usage: ${error}`);
        }
    }
    async recommendTags(problemTitle, problemDescription, existingTags, options) {
        try {
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.recommendTags(problemTitle, problemDescription, existingTags, options);
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Failed to recommend tags: ${error}`);
        }
    }
    async normalizeTagSet(tags, options) {
        try {
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.normalizeTagSet(tags, options);
            return result;
        }
        catch (error) {
            return Result.fail(`Failed to normalize tag set: ${error}`);
        }
    }
    async searchTags(query, availableTags, options) {
        try {
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.searchTags(query, availableTags, options);
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Failed to search tags: ${error}`);
        }
    }
    async clusterSimilarTags(tags, options) {
        try {
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.clusterSimilarTags(tags, options);
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Failed to cluster tags: ${error}`);
        }
    }
    async analyzeTagHierarchy(tags, options) {
        try {
            const { TagManagementService } = await import('./TagManagementService');
            const result = TagManagementService.analyzeTagHierarchy(tags, options);
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Failed to analyze tag hierarchy: ${error}`);
        }
    }
}
//# sourceMappingURL=ITagManagementService.js.map