// 매직 넘버 상수화 & 옵션화

// 태그 관리 상수
export class TagManagementConstants {
  static readonly MAX_TAGS_PER_PROBLEM = 10;
  static readonly DEFAULT_MAX_SUGGESTIONS = 5;
  static readonly DEFAULT_SIMILARITY_THRESHOLD = 0.5;
  static readonly MIN_TAG_LENGTH = 1;
  static readonly MAX_TAG_LENGTH = 50;
  static readonly LEVENSHTEIN_SIMILARITY_THRESHOLD = 0.7;
  static readonly MIN_USAGE_COUNT = 1;
  static readonly MAX_SEARCH_RESULTS = 20;
  static readonly MIN_WORD_LENGTH_FOR_ANALYSIS = 2;
  static readonly MAX_RECOMMENDATIONS = 3;
}

// 난이도 분석 상수
export class DifficultyAnalysisConstants {
  static readonly PERFORMANCE_ADJUSTMENT_THRESHOLD = 0.1;
  static readonly BALANCE_TOLERANCE_PERCENTAGE = 5;
  static readonly PROGRESSIVE_SCORE_THRESHOLD = 0.7;
  static readonly BALANCE_SCORE_THRESHOLD = 0.8;
  static readonly MAX_DIFFICULTY_CHANGE = 1;
  static readonly RECENT_HISTORY_SIZE = 5;
  static readonly IMBALANCE_THRESHOLD_PERCENTAGE = 30; // 30% 이상이면 재조정
  static readonly MIN_PROGRESSION_RANGE = 1;
  static readonly MAX_PROGRESSION_RANGE = 3;
  static readonly DEFAULT_TARGET_SUCCESS_RATE = 0.7;
  static readonly CONFIDENCE_ADJUSTMENT_FACTOR = 0.8;
}

// 채점 정책 상수
export class ScoringPolicyConstants {
  static readonly MIN_POINTS = 0;
  static readonly MAX_POINTS = 1000;
  static readonly DEFAULT_POINTS = 10;
  static readonly DEFAULT_MINIMUM_THRESHOLD = 0.0;
}

// 태그 관리 옵션 인터페이스
export interface TagManagementOptions {
  maxTagsPerProblem?: number;
  maxSuggestions?: number;
  similarityThreshold?: number;
  minTagLength?: number;
  maxTagLength?: number;
  levenshteinSimilarityThreshold?: number;
  minUsageCount?: number;
  maxSearchResults?: number;
  minWordLengthForAnalysis?: number;
  maxRecommendations?: number;
  enableHierarchyAnalysis?: boolean;
  enableClustering?: boolean;
  enableAutoComplete?: boolean;
  caseSensitive?: boolean;
}

// 난이도 분석 옵션 인터페이스
export interface DifficultyAnalysisOptions {
  targetSuccessRate?: number;
  performanceAdjustmentThreshold?: number;
  balanceTolerancePercentage?: number;
  progressiveScoreThreshold?: number;
  balanceScoreThreshold?: number;
  maxDifficultyChange?: number;
  recentHistorySize?: number;
  imbalanceThresholdPercentage?: number;
  minProgressionRange?: number;
  maxProgressionRange?: number;
  confidenceAdjustmentFactor?: number;
  enableAdaptiveDifficulty?: boolean;
  enableProgressionAnalysis?: boolean;
  enableConsistencyCheck?: boolean;
}

// 채점 정책 옵션 인터페이스
export interface ScoringPolicyOptions {
  minPoints?: number;
  maxPoints?: number;
  defaultPoints?: number;
  defaultMinimumThreshold?: number;
  roundingStrategy?: 'round' | 'floor' | 'ceil';
  enablePartialCredit?: boolean;
}

// 통합 문제 관리 설정
export interface ProblemManagementConfig {
  tags: TagManagementOptions;
  difficulty: DifficultyAnalysisOptions;
  scoring: ScoringPolicyOptions;
}

// 설정 프로필 클래스
export class ProblemManagementProfiles {
  // 기본 설정 (보수적)
  static readonly DEFAULT_CONFIG: ProblemManagementConfig = {
    tags: {
      maxTagsPerProblem: TagManagementConstants.MAX_TAGS_PER_PROBLEM,
      maxSuggestions: TagManagementConstants.DEFAULT_MAX_SUGGESTIONS,
      similarityThreshold: TagManagementConstants.DEFAULT_SIMILARITY_THRESHOLD,
      minTagLength: TagManagementConstants.MIN_TAG_LENGTH,
      maxTagLength: TagManagementConstants.MAX_TAG_LENGTH,
      levenshteinSimilarityThreshold: TagManagementConstants.LEVENSHTEIN_SIMILARITY_THRESHOLD,
      minUsageCount: TagManagementConstants.MIN_USAGE_COUNT,
      maxSearchResults: TagManagementConstants.MAX_SEARCH_RESULTS,
      minWordLengthForAnalysis: TagManagementConstants.MIN_WORD_LENGTH_FOR_ANALYSIS,
      maxRecommendations: TagManagementConstants.MAX_RECOMMENDATIONS,
      enableHierarchyAnalysis: true,
      enableClustering: true,
      enableAutoComplete: true,
      caseSensitive: false
    },
    difficulty: {
      targetSuccessRate: DifficultyAnalysisConstants.DEFAULT_TARGET_SUCCESS_RATE,
      performanceAdjustmentThreshold: DifficultyAnalysisConstants.PERFORMANCE_ADJUSTMENT_THRESHOLD,
      balanceTolerancePercentage: DifficultyAnalysisConstants.BALANCE_TOLERANCE_PERCENTAGE,
      progressiveScoreThreshold: DifficultyAnalysisConstants.PROGRESSIVE_SCORE_THRESHOLD,
      balanceScoreThreshold: DifficultyAnalysisConstants.BALANCE_SCORE_THRESHOLD,
      maxDifficultyChange: DifficultyAnalysisConstants.MAX_DIFFICULTY_CHANGE,
      recentHistorySize: DifficultyAnalysisConstants.RECENT_HISTORY_SIZE,
      imbalanceThresholdPercentage: DifficultyAnalysisConstants.IMBALANCE_THRESHOLD_PERCENTAGE,
      minProgressionRange: DifficultyAnalysisConstants.MIN_PROGRESSION_RANGE,
      maxProgressionRange: DifficultyAnalysisConstants.MAX_PROGRESSION_RANGE,
      confidenceAdjustmentFactor: DifficultyAnalysisConstants.CONFIDENCE_ADJUSTMENT_FACTOR,
      enableAdaptiveDifficulty: true,
      enableProgressionAnalysis: true,
      enableConsistencyCheck: true
    },
    scoring: {
      minPoints: ScoringPolicyConstants.MIN_POINTS,
      maxPoints: ScoringPolicyConstants.MAX_POINTS,
      defaultPoints: ScoringPolicyConstants.DEFAULT_POINTS,
      defaultMinimumThreshold: ScoringPolicyConstants.DEFAULT_MINIMUM_THRESHOLD,
      roundingStrategy: 'round',
      enablePartialCredit: true
    }
  };

  // 고급 사용자 설정 (더 유연함)
  static readonly ADVANCED_CONFIG: ProblemManagementConfig = {
    tags: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
      maxTagsPerProblem: 15, // 더 많은 태그 허용
      maxSuggestions: 8,
      similarityThreshold: 0.3, // 더 관대한 유사도
      levenshteinSimilarityThreshold: 0.6,
      maxSearchResults: 50,
      enableHierarchyAnalysis: true,
      enableClustering: true
    },
    difficulty: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
      performanceAdjustmentThreshold: 0.05, // 더 민감한 조정
      balanceTolerancePercentage: 3, // 더 엄격한 균형
      maxDifficultyChange: 1.5, // 더 큰 변화 허용
      recentHistorySize: 10, // 더 많은 이력 고려
      imbalanceThresholdPercentage: 20 // 더 빠른 재조정
    },
    scoring: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
      roundingStrategy: 'ceil', // 학생에게 유리하게
      defaultMinimumThreshold: 0.2 // 20% 이상 필요
    }
  };

  // 학습 최적화 설정 (교육 효과 중심)
  static readonly LEARNING_OPTIMIZED_CONFIG: ProblemManagementConfig = {
    tags: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
      maxTagsPerProblem: 8, // 집중도를 위해 제한
      maxSuggestions: 3,
      similarityThreshold: 0.6, // 더 정확한 태그
      enableAutoComplete: true,
      enableHierarchyAnalysis: true
    },
    difficulty: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
      targetSuccessRate: 0.8, // 더 높은 성공률 목표
      performanceAdjustmentThreshold: 0.05,
      maxDifficultyChange: 0.5, // 더 점진적 변화
      recentHistorySize: 7,
      progressiveScoreThreshold: 0.8, // 더 엄격한 진행도
      enableAdaptiveDifficulty: true,
      enableProgressionAnalysis: true
    },
    scoring: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
      roundingStrategy: 'round',
      defaultMinimumThreshold: 0.3, // 30% 최소 요구사항
      enablePartialCredit: true
    }
  };

  // 평가 중심 설정 (정확성 중심)
  static readonly ASSESSMENT_FOCUSED_CONFIG: ProblemManagementConfig = {
    tags: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
      maxTagsPerProblem: 5, // 명확한 분류
      maxSuggestions: 3,
      similarityThreshold: 0.8, // 매우 정확한 태그만
      enableClustering: false, // 명확한 분류 우선
      caseSensitive: true // 정확성 중시
    },
    difficulty: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
      targetSuccessRate: 0.6, // 변별력 있는 난이도
      balanceScoreThreshold: 0.9, // 매우 엄격한 균형
      maxDifficultyChange: 1, // 안정적인 난이도
      enableAdaptiveDifficulty: false, // 고정 난이도 선호
      enableConsistencyCheck: true
    },
    scoring: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
      roundingStrategy: 'floor', // 엄격한 채점
      defaultMinimumThreshold: 0.5, // 50% 최소 요구사항
      enablePartialCredit: false // 전체 정답만 인정
    }
  };

  // 빠른 프로토타이핑 설정 (관대함)
  static readonly PROTOTYPE_CONFIG: ProblemManagementConfig = {
    tags: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
      maxTagsPerProblem: 20, // 매우 많은 태그 허용
      maxSuggestions: 10,
      similarityThreshold: 0.2, // 매우 관대한 유사도
      enableHierarchyAnalysis: false, // 간단함 우선
      enableClustering: false
    },
    difficulty: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
      balanceTolerancePercentage: 15, // 매우 관대한 균형
      maxDifficultyChange: 2, // 빠른 조정 허용
      enableConsistencyCheck: false // 빠른 개발 우선
    },
    scoring: {
      ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
      roundingStrategy: 'ceil', // 관대한 채점
      enablePartialCredit: true
    }
  };
}

// 설정 병합 유틸리티
export class ConfigMerger {
  static mergeTagOptions(
    base: TagManagementOptions,
    override: Partial<TagManagementOptions>
  ): TagManagementOptions {
    return { ...base, ...override };
  }

  static mergeDifficultyOptions(
    base: DifficultyAnalysisOptions,
    override: Partial<DifficultyAnalysisOptions>
  ): DifficultyAnalysisOptions {
    return { ...base, ...override };
  }

  static mergeScoringOptions(
    base: ScoringPolicyOptions,
    override: Partial<ScoringPolicyOptions>
  ): ScoringPolicyOptions {
    return { ...base, ...override };
  }

  static mergeConfigs(
    base: ProblemManagementConfig,
    override: Partial<ProblemManagementConfig>
  ): ProblemManagementConfig {
    return {
      tags: override.tags ? this.mergeTagOptions(base.tags, override.tags) : base.tags,
      difficulty: override.difficulty ? this.mergeDifficultyOptions(base.difficulty, override.difficulty) : base.difficulty,
      scoring: override.scoring ? this.mergeScoringOptions(base.scoring, override.scoring) : base.scoring
    };
  }
}

// 설정 검증 유틸리티
export class ConfigValidator {
  static validateTagOptions(options: TagManagementOptions): string[] {
    const errors: string[] = [];

    if (options.maxTagsPerProblem !== undefined) {
      if (options.maxTagsPerProblem < 1 || options.maxTagsPerProblem > 50) {
        errors.push('maxTagsPerProblem must be between 1 and 50');
      }
    }

    if (options.similarityThreshold !== undefined) {
      if (options.similarityThreshold < 0 || options.similarityThreshold > 1) {
        errors.push('similarityThreshold must be between 0 and 1');
      }
    }

    if (options.minTagLength !== undefined && options.maxTagLength !== undefined) {
      if (options.minTagLength > options.maxTagLength) {
        errors.push('minTagLength cannot be greater than maxTagLength');
      }
    }

    return errors;
  }

  static validateDifficultyOptions(options: DifficultyAnalysisOptions): string[] {
    const errors: string[] = [];

    if (options.targetSuccessRate !== undefined) {
      if (options.targetSuccessRate < 0 || options.targetSuccessRate > 1) {
        errors.push('targetSuccessRate must be between 0 and 1');
      }
    }

    if (options.balanceTolerancePercentage !== undefined) {
      if (options.balanceTolerancePercentage < 0 || options.balanceTolerancePercentage > 100) {
        errors.push('balanceTolerancePercentage must be between 0 and 100');
      }
    }

    if (options.maxDifficultyChange !== undefined) {
      if (options.maxDifficultyChange < 0 || options.maxDifficultyChange > 4) {
        errors.push('maxDifficultyChange must be between 0 and 4');
      }
    }

    return errors;
  }

  static validateScoringOptions(options: ScoringPolicyOptions): string[] {
    const errors: string[] = [];

    if (options.minPoints !== undefined && options.maxPoints !== undefined) {
      if (options.minPoints > options.maxPoints) {
        errors.push('minPoints cannot be greater than maxPoints');
      }
    }

    if (options.defaultMinimumThreshold !== undefined) {
      if (options.defaultMinimumThreshold < 0 || options.defaultMinimumThreshold > 1) {
        errors.push('defaultMinimumThreshold must be between 0 and 1');
      }
    }

    return errors;
  }

  static validateConfig(config: ProblemManagementConfig): string[] {
    const errors: string[] = [];
    
    errors.push(...this.validateTagOptions(config.tags));
    errors.push(...this.validateDifficultyOptions(config.difficulty));
    errors.push(...this.validateScoringOptions(config.scoring));

    return errors;
  }
}