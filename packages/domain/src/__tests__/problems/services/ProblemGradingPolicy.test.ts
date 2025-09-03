// ProblemGradingPolicy 도메인 서비스 테스트
import { describe, it, expect } from 'vitest';
import { ProblemGradingPolicy } from '../../../problems/services/ProblemGradingPolicy';
import { ProblemType } from '../../../problems/value-objects/ProblemType';

describe('ProblemGradingPolicy 도메인 서비스', () => {
  
  describe('채점 방식 결정', () => {
    it('서술형 문제는 수동 채점이 필요하다', () => {
      // Given
      const problemType = ProblemType.longAnswer();

      // When
      const requiresManual = ProblemGradingPolicy.requiresManualGrading(problemType);

      // Then
      expect(requiresManual).toBe(true);
    });

    it('객관식 문제는 자동 채점이 가능하다', () => {
      // Given
      const problemType = ProblemType.multipleChoice();

      // When
      const supportsAuto = ProblemGradingPolicy.supportsAutoGrading(problemType);

      // Then
      expect(supportsAuto).toBe(true);
    });

    it('단답식 문제는 자동 채점이 가능하다', () => {
      // Given
      const problemType = ProblemType.shortAnswer();

      // When
      const supportsAuto = ProblemGradingPolicy.supportsAutoGrading(problemType);

      // Then
      expect(supportsAuto).toBe(true);
    });

    it('참/거짓 문제는 자동 채점이 가능하다', () => {
      // Given
      const problemType = ProblemType.trueFalse();

      // When
      const supportsAuto = ProblemGradingPolicy.supportsAutoGrading(problemType);

      // Then
      expect(supportsAuto).toBe(true);
    });
  });

  describe('부분 점수 지원', () => {
    it('짝맞추기 문제는 부분 점수를 지원한다', () => {
      // Given
      const problemType = ProblemType.matching();

      // When
      const supportsPartial = ProblemGradingPolicy.supportsPartialScoring(problemType);

      // Then
      expect(supportsPartial).toBe(true);
    });

    it('빈칸채우기 문제는 부분 점수를 지원한다', () => {
      // Given
      const problemType = ProblemType.fillBlank();

      // When
      const supportsPartial = ProblemGradingPolicy.supportsPartialScoring(problemType);

      // Then
      expect(supportsPartial).toBe(true);
    });

    it('순서배열 문제는 부분 점수를 지원한다', () => {
      // Given
      const problemType = ProblemType.ordering();

      // When
      const supportsPartial = ProblemGradingPolicy.supportsPartialScoring(problemType);

      // Then
      expect(supportsPartial).toBe(true);
    });

    it('객관식 문제는 부분 점수를 지원하지 않는다', () => {
      // Given
      const problemType = ProblemType.multipleChoice();

      // When
      const supportsPartial = ProblemGradingPolicy.supportsPartialScoring(problemType);

      // Then
      expect(supportsPartial).toBe(false);
    });

    it('참/거짓 문제는 부분 점수를 지원하지 않는다', () => {
      // Given
      const problemType = ProblemType.trueFalse();

      // When
      const supportsPartial = ProblemGradingPolicy.supportsPartialScoring(problemType);

      // Then
      expect(supportsPartial).toBe(false);
    });
  });

  describe('즉시 피드백 지원', () => {
    it('자동 채점 가능한 문제는 즉시 피드백을 지원한다', () => {
      // Given
      const problemType = ProblemType.multipleChoice();

      // When
      const supportsImmediate = ProblemGradingPolicy.supportsImmediateFeedback(problemType);

      // Then
      expect(supportsImmediate).toBe(true);
    });

    it('수동 채점 문제는 즉시 피드백을 지원하지 않는다', () => {
      // Given
      const problemType = ProblemType.longAnswer();

      // When
      const supportsImmediate = ProblemGradingPolicy.supportsImmediateFeedback(problemType);

      // Then
      expect(supportsImmediate).toBe(false);
    });
  });

  describe('점수 제한', () => {
    it('대부분 문제 유형은 점수 제한이 없다', () => {
      // Given
      const problemTypes = [
        ProblemType.multipleChoice(),
        ProblemType.shortAnswer(),
        ProblemType.longAnswer(),
        ProblemType.trueFalse()
      ];

      problemTypes.forEach(type => {
        // When
        const limit = ProblemGradingPolicy.getMaxScoreLimit(type);

        // Then
        expect(limit).toBeNull();
      });
    });
  });

  describe('최소 선택지 수', () => {
    it('객관식 문제는 최소 2개의 선택지가 필요하다', () => {
      // Given
      const problemType = ProblemType.multipleChoice();

      // When
      const minChoices = ProblemGradingPolicy.getMinimumChoices(problemType);

      // Then
      expect(minChoices).toBe(2);
    });

    it('참/거짓 문제는 최소 2개의 선택지가 필요하다', () => {
      // Given
      const problemType = ProblemType.trueFalse();

      // When
      const minChoices = ProblemGradingPolicy.getMinimumChoices(problemType);

      // Then
      expect(minChoices).toBe(2);
    });

    it('짝맞추기 문제는 최소 2개의 선택지가 필요하다', () => {
      // Given
      const problemType = ProblemType.matching();

      // When
      const minChoices = ProblemGradingPolicy.getMinimumChoices(problemType);

      // Then
      expect(minChoices).toBe(2);
    });

    it('단답식 문제는 최소 선택지 수 제한이 없다', () => {
      // Given
      const problemType = ProblemType.shortAnswer();

      // When
      const minChoices = ProblemGradingPolicy.getMinimumChoices(problemType);

      // Then
      expect(minChoices).toBeNull();
    });
  });

  describe('권장 선택지 수', () => {
    it('객관식 문제는 4개의 선택지를 권장한다', () => {
      // Given
      const problemType = ProblemType.multipleChoice();

      // When
      const recommendedChoices = ProblemGradingPolicy.getRecommendedChoices(problemType);

      // Then
      expect(recommendedChoices).toBe(4);
    });

    it('참/거짓 문제는 2개의 선택지를 권장한다', () => {
      // Given
      const problemType = ProblemType.trueFalse();

      // When
      const recommendedChoices = ProblemGradingPolicy.getRecommendedChoices(problemType);

      // Then
      expect(recommendedChoices).toBe(2);
    });

    it('짝맞추기 문제는 4개의 선택지를 권장한다', () => {
      // Given
      const problemType = ProblemType.matching();

      // When
      const recommendedChoices = ProblemGradingPolicy.getRecommendedChoices(problemType);

      // Then
      expect(recommendedChoices).toBe(4);
    });
  });

  describe('답안 검증 필요성', () => {
    it('자동 채점 문제는 답안 검증이 필요하다', () => {
      // Given
      const autoGradingTypes = [
        ProblemType.multipleChoice(),
        ProblemType.shortAnswer(),
        ProblemType.trueFalse(),
        ProblemType.matching()
      ];

      autoGradingTypes.forEach(type => {
        // When
        const requiresValidation = ProblemGradingPolicy.requiresAnswerValidation(type);

        // Then
        expect(requiresValidation).toBe(true);
      });
    });

    it('수동 채점 문제는 답안 검증이 필요하지 않다', () => {
      // Given
      const problemType = ProblemType.longAnswer();

      // When
      const requiresValidation = ProblemGradingPolicy.requiresAnswerValidation(problemType);

      // Then
      expect(requiresValidation).toBe(false);
    });
  });

  describe('시간 제한 권장', () => {
    it('서술형 문제는 시간 제한을 권장한다', () => {
      // Given
      const problemType = ProblemType.longAnswer();

      // When
      const recommendsTimeLimit = ProblemGradingPolicy.recommendsTimeLimit(problemType);

      // Then
      expect(recommendsTimeLimit).toBe(true);
    });

    it('다른 문제 유형들은 시간 제한을 권장하지 않는다', () => {
      // Given
      const otherTypes = [
        ProblemType.multipleChoice(),
        ProblemType.shortAnswer(),
        ProblemType.trueFalse(),
        ProblemType.matching(),
        ProblemType.fillBlank(),
        ProblemType.ordering()
      ];

      otherTypes.forEach(type => {
        // When
        const recommendsTimeLimit = ProblemGradingPolicy.recommendsTimeLimit(type);

        // Then
        expect(recommendsTimeLimit).toBe(false);
      });
    });
  });
});