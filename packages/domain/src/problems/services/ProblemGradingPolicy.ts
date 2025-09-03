import { ProblemType } from '../value-objects/ProblemType';

// 정책/서비스 분리 - 채점 정책을 별도 서비스로 관리
export class ProblemGradingPolicy {
  
  // 수동 채점이 필요한 문제 유형들
  private static readonly MANUAL_GRADING_TYPES: ReadonlySet<string> = new Set([
    ProblemType.TYPES.LONG_ANSWER
  ]);

  // 자동 채점이 가능한 문제 유형들
  private static readonly AUTO_GRADING_TYPES: ReadonlySet<string> = new Set([
    ProblemType.TYPES.MULTIPLE_CHOICE,
    ProblemType.TYPES.SHORT_ANSWER,
    ProblemType.TYPES.TRUE_FALSE,
    ProblemType.TYPES.MATCHING,
    ProblemType.TYPES.FILL_BLANK,
    ProblemType.TYPES.ORDERING
  ]);

  // 부분 점수를 지원하는 문제 유형들
  private static readonly PARTIAL_SCORING_TYPES: ReadonlySet<string> = new Set([
    ProblemType.TYPES.MATCHING,
    ProblemType.TYPES.FILL_BLANK,
    ProblemType.TYPES.ORDERING
  ]);

  /**
   * 수동 채점이 필요한지 확인
   */
  public static requiresManualGrading(problemType: ProblemType): boolean {
    return this.MANUAL_GRADING_TYPES.has(problemType.value);
  }

  /**
   * 자동 채점이 가능한지 확인
   */
  public static supportsAutoGrading(problemType: ProblemType): boolean {
    return this.AUTO_GRADING_TYPES.has(problemType.value);
  }

  /**
   * 부분 점수를 지원하는지 확인
   */
  public static supportsPartialScoring(problemType: ProblemType): boolean {
    return this.PARTIAL_SCORING_TYPES.has(problemType.value);
  }

  /**
   * 즉시 피드백이 가능한지 확인
   */
  public static supportsImmediateFeedback(problemType: ProblemType): boolean {
    return this.supportsAutoGrading(problemType);
  }

  /**
   * 문제 유형별 최대 점수 제한 확인
   */
  public static getMaxScoreLimit(problemType: ProblemType): number | null {
    // 대부분 문제는 점수 제한이 없지만, 필요시 확장 가능
    return null;
  }

  /**
   * 문제 유형별 최소 선택지 수 확인
   */
  public static getMinimumChoices(problemType: ProblemType): number | null {
    switch (problemType.value) {
      case ProblemType.TYPES.MULTIPLE_CHOICE:
        return 2;
      case ProblemType.TYPES.TRUE_FALSE:
        return 2;
      case ProblemType.TYPES.MATCHING:
        return 2;
      default:
        return null;
    }
  }

  /**
   * 문제 유형별 권장 선택지 수
   */
  public static getRecommendedChoices(problemType: ProblemType): number | null {
    switch (problemType.value) {
      case ProblemType.TYPES.MULTIPLE_CHOICE:
        return 4;
      case ProblemType.TYPES.TRUE_FALSE:
        return 2;
      case ProblemType.TYPES.MATCHING:
        return 4;
      default:
        return null;
    }
  }

  /**
   * 답안 형태 검증이 필요한지 확인
   */
  public static requiresAnswerValidation(problemType: ProblemType): boolean {
    return this.supportsAutoGrading(problemType);
  }

  /**
   * 시간 제한 적용이 권장되는지 확인
   */
  public static recommendsTimeLimit(problemType: ProblemType): boolean {
    switch (problemType.value) {
      case ProblemType.TYPES.LONG_ANSWER:
        return true; // 서술형은 시간 제한 권장
      default:
        return false;
    }
  }
}