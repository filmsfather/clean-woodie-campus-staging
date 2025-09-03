// 점수 정책 일관화

export class ScoringPolicy {
  public static readonly MIN_POINTS = 0;
  public static readonly MAX_POINTS = 1000;
  public static readonly DEFAULT_POINTS = 10;

  public static validatePoints(points: number): boolean {
    return Number.isFinite(points) && 
           points >= this.MIN_POINTS && 
           points <= this.MAX_POINTS;
  }

  public static calculatePartialScore(
    correctCount: number,
    totalCount: number,
    maxPoints: number,
    roundingStrategy: 'round' | 'floor' | 'ceil' = 'round'
  ): number {
    if (totalCount === 0) return 0;
    
    const ratio = correctCount / totalCount;
    const score = ratio * maxPoints;
    
    switch (roundingStrategy) {
      case 'round': return Math.round(score);
      case 'floor': return Math.floor(score);
      case 'ceil': return Math.ceil(score);
      default: return Math.round(score);
    }
  }

  public static applyMinimumThreshold(
    score: number,
    totalPoints: number,
    threshold: number = 0.0
  ): number {
    const ratio = score / totalPoints;
    return ratio >= threshold ? score : 0;
  }
}

// 부분 점수 범위 클린업
export class PartialScoringStrategy {
  public static calculate(params: {
    correctItems: number;
    totalItems: number;
    maxPoints: number;
    allowPartialCredit: boolean;
    minimumThreshold?: number; // 0.0 ~ 1.0 범위
    roundingStrategy?: 'round' | 'floor' | 'ceil';
  }): number {
    // 전체 정답이거나 부분 점수를 허용하지 않는 경우
    if (!params.allowPartialCredit) {
      return params.correctItems === params.totalItems ? params.maxPoints : 0;
    }

    // 기본 부분 점수 계산
    const partialScore = ScoringPolicy.calculatePartialScore(
      params.correctItems,
      params.totalItems,
      params.maxPoints,
      params.roundingStrategy
    );

    // 최소 임계점 적용
    if (params.minimumThreshold !== undefined) {
      return ScoringPolicy.applyMinimumThreshold(
        partialScore,
        params.maxPoints,
        params.minimumThreshold
      );
    }

    return partialScore;
  }

  // 문제 유형별 기본 부분 점수 정책
  public static getDefaultPartialCreditPolicy(problemType: string): {
    allowsPartialCredit: boolean;
    minimumThreshold?: number;
  } {
    switch (problemType) {
      case 'multiple_choice':
        return { allowsPartialCredit: false }; // 보통 전체 정답만 인정
      case 'matching':
        return { allowsPartialCredit: true, minimumThreshold: 0.3 }; // 30% 이상
      case 'fill_blank':
        return { allowsPartialCredit: true, minimumThreshold: 0.5 }; // 50% 이상
      case 'ordering':
        return { allowsPartialCredit: true, minimumThreshold: 0.4 }; // 40% 이상
      case 'short_answer':
        return { allowsPartialCredit: false }; // 정확한 답만 인정
      case 'true_false':
        return { allowsPartialCredit: false }; // 이분법적 답안
      case 'long_answer':
        return { allowsPartialCredit: true }; // 수동 채점에서 결정
      default:
        return { allowsPartialCredit: false };
    }
  }
}