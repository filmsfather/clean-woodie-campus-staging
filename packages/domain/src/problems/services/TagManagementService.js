import { Result } from '../../common/Result';
import { Tag } from '../value-objects/Tag';
import { ProblemManagementProfiles } from './ProblemManagementConfig';
// 태그 관리를 위한 도메인 서비스 (매직 넘버 상수화 & 옵션화)
export class TagManagementService {
    // 태그 자동 완성을 위한 유사도 계산 (옵션화)
    static findSimilarTags(inputTag, existingTags, options = {}) {
        // 기본 설정과 병합
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        const maxSuggestions = config.maxSuggestions;
        const threshold = config.similarityThreshold;
        const normalizedInput = Tag.normalize(inputTag);
        if (normalizedInput.length === 0) {
            return [];
        }
        const similarities = existingTags
            .map(tag => ({
            tag,
            similarity: this.calculateSimilarity(normalizedInput, tag.name)
        }))
            .filter(item => item.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxSuggestions)
            .map(item => item.tag);
        return similarities;
    }
    // 레벤슈타인 거리 기반 유사도 계산
    static calculateSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0)
            return 1;
        return 1 - (distance / maxLength);
    }
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        // 초기화
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        // 거리 계산
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // 치환
                    matrix[i][j - 1] + 1, // 삽입
                    matrix[i - 1][j] + 1 // 삭제
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    // 태그 사용 빈도 분석 (옵션화)
    static analyzeTagUsage(problemTags, options = {}) {
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        const minUsageCount = config.minUsageCount;
        const tagCounts = new Map();
        let totalTags = 0;
        // 태그 빈도 계산
        for (const tags of problemTags) {
            for (const tag of tags) {
                const tagName = tag.name;
                const existing = tagCounts.get(tagName);
                if (existing) {
                    existing.count++;
                }
                else {
                    tagCounts.set(tagName, { tag, count: 1 });
                }
                totalTags++;
            }
        }
        // 최소 사용 횟수 필터링 및 정렬
        const results = Array.from(tagCounts.values())
            .filter(item => item.count >= minUsageCount)
            .map(item => ({
            tag: item.tag,
            count: item.count,
            percentage: totalTags > 0 ? (item.count / totalTags) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        return results;
    }
    // 태그 계층구조 분석 (옵션화)
    static analyzeTagHierarchy(tags, options = {}) {
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        if (!config.enableHierarchyAnalysis) {
            return new Map();
        }
        const hierarchy = new Map();
        for (const tag of tags) {
            const parts = tag.name.split('-');
            if (parts.length > 1) {
                const parent = parts[0];
                const existing = hierarchy.get(parent) || [];
                existing.push(tag);
                hierarchy.set(parent, existing);
            }
        }
        return hierarchy;
    }
    // 태그 클러스터링 (옵션화)
    static clusterSimilarTags(tags, options = {}) {
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        if (!config.enableClustering) {
            return tags.map(tag => [tag]); // 각각을 개별 클러스터로
        }
        const similarityThreshold = config.levenshteinSimilarityThreshold;
        const clusters = [];
        const processed = new Set();
        for (const tag of tags) {
            if (processed.has(tag.name)) {
                continue;
            }
            const cluster = [tag];
            processed.add(tag.name);
            // 유사한 태그들 찾기
            for (const otherTag of tags) {
                if (processed.has(otherTag.name)) {
                    continue;
                }
                const similarity = this.calculateSimilarity(tag.name, otherTag.name);
                if (similarity >= similarityThreshold) {
                    cluster.push(otherTag);
                    processed.add(otherTag.name);
                }
            }
            clusters.push(cluster);
        }
        return clusters;
    }
    // 태그 추천 (문제 내용 기반) (옵션화)
    static recommendTags(problemTitle, problemDescription, existingTags, options = {}) {
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        const maxRecommendations = config.maxRecommendations;
        const minWordLength = config.minWordLengthForAnalysis;
        const content = (problemTitle + ' ' + problemDescription).toLowerCase();
        const words = content
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length >= minWordLength);
        const recommendations = [];
        for (const tag of existingTags) {
            let relevance = 0;
            // 완전 일치
            if (content.includes(tag.name)) {
                relevance += 3;
            }
            // 부분 일치
            const tagWords = tag.name.split(/[-_\s]/);
            for (const tagWord of tagWords) {
                if (tagWord.length >= minWordLength) {
                    for (const contentWord of words) {
                        if (contentWord.includes(tagWord) || tagWord.includes(contentWord)) {
                            relevance += 1;
                        }
                    }
                }
            }
            if (relevance > 0) {
                recommendations.push({ tag, relevance });
            }
        }
        return recommendations
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxRecommendations)
            .map(item => item.tag);
    }
    // 태그 정규화 및 정리 (옵션화)
    static normalizeTagSet(tags, options = {}) {
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        // 중복 제거
        const uniqueTags = Tag.removeDuplicates(tags);
        // 길이 제한 확인 (상수 사용)
        const maxTags = config.maxTagsPerProblem;
        if (uniqueTags.length > maxTags) {
            return Result.fail(`Cannot have more than ${maxTags} tags`);
        }
        // 빈 태그 제거
        const validTags = uniqueTags.filter(tag => tag.name && tag.name.trim().length > 0);
        return Result.ok(validTags);
    }
    // 태그 검색 (전문 검색) (옵션화)
    static searchTags(query, availableTags, options = {}) {
        const config = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
        const caseSensitive = config.caseSensitive || false;
        const maxResults = config.maxSearchResults;
        const exactMatch = false; // 기본값
        let searchQuery = query.trim();
        if (!caseSensitive) {
            searchQuery = searchQuery.toLowerCase();
        }
        if (searchQuery.length === 0) {
            return [];
        }
        const results = availableTags
            .filter(tag => {
            let tagName = tag.name;
            if (!caseSensitive) {
                tagName = tagName.toLowerCase();
            }
            if (exactMatch) {
                return tagName === searchQuery;
            }
            else {
                return tagName.includes(searchQuery) || searchQuery.includes(tagName);
            }
        })
            .slice(0, maxResults);
        return results;
    }
    // 태그 통계 정보
    static getTagStatistics(problemTags) {
        const tagCounts = new Map();
        let totalTagCount = 0;
        for (const tags of problemTags) {
            totalTagCount += tags.length;
            for (const tag of tags) {
                const count = tagCounts.get(tag.name) || 0;
                tagCounts.set(tag.name, count + 1);
            }
        }
        const totalProblems = problemTags.length;
        const averageTagsPerProblem = totalProblems > 0 ? totalTagCount / totalProblems : 0;
        // 가장 많이 사용된 태그
        let mostUsedTag = null;
        let maxCount = 0;
        for (const [tagName, count] of tagCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostUsedTag = { tag: tagName, count };
            }
        }
        // 태그 분포
        const tagDistribution = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({
            tag,
            count,
            percentage: totalTagCount > 0 ? (count / totalTagCount) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        return {
            totalUniqueTags: tagCounts.size,
            averageTagsPerProblem,
            mostUsedTag,
            tagDistribution
        };
    }
}
// 설정 가능한 태그 관리 서비스 (인스턴스 기반)
export class ConfigurableTagManagementService {
    options;
    constructor(options = {}) {
        // 기본값과 병합
        this.options = {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            ...options
        };
    }
    // 런타임 설정 변경
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
    getOptions() {
        return { ...this.options };
    }
    // 인스턴스 메서드들 (설정 적용됨)
    findSimilarTags(input, tags) {
        return TagManagementService.findSimilarTags(input, tags, this.options);
    }
    analyzeTagUsage(problemTags) {
        return TagManagementService.analyzeTagUsage(problemTags, this.options);
    }
    recommendTags(title, description, existingTags) {
        return TagManagementService.recommendTags(title, description, existingTags, this.options);
    }
    normalizeTagSet(tags) {
        return TagManagementService.normalizeTagSet(tags, this.options);
    }
    searchTags(query, availableTags) {
        return TagManagementService.searchTags(query, availableTags, this.options);
    }
    clusterSimilarTags(tags) {
        return TagManagementService.clusterSimilarTags(tags, this.options);
    }
    analyzeTagHierarchy(tags) {
        return TagManagementService.analyzeTagHierarchy(tags, this.options);
    }
}
//# sourceMappingURL=TagManagementService.js.map