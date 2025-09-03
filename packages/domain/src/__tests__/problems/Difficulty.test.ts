// Difficulty Value Object 테스트
import { describe, it, expect } from 'vitest';
import { Difficulty } from '../../problems/value-objects/Difficulty';

describe('Difficulty Value Object', () => {
  
  describe('생성 및 유효성 검증', () => {
    it('유효한 난이도 레벨로 생성할 수 있다', () => {
      // When
      const result = Difficulty.create(3);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.level).toBe(3);
    });

    it('1-5 범위 내의 모든 레벨로 생성할 수 있다', () => {
      // Given
      const validLevels = [1, 2, 3, 4, 5];

      validLevels.forEach(level => {
        // When
        const result = Difficulty.create(level);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.value!.level).toBe(level);
      });
    });

    it('잘못된 난이도 레벨로는 생성할 수 없다', () => {
      // Given
      const invalidLevels = [0, 6, -1, 10, 1.5];

      invalidLevels.forEach(level => {
        // When
        const result = Difficulty.create(level);

        // Then
        expect(result.isSuccess).toBe(false);
        expect(result.error).toContain('Invalid difficulty level');
      });
    });

    it('소수점 숫자로는 생성할 수 없다', () => {
      // When
      const result = Difficulty.create(2.5);

      // Then
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('편의 생성자 메서드', () => {
    it('veryEasy() 메서드로 매우 쉬움 난이도를 생성할 수 있다', () => {
      // When
      const difficulty = Difficulty.veryEasy();

      // Then
      expect(difficulty.level).toBe(1);
    });

    it('easy() 메서드로 쉬움 난이도를 생성할 수 있다', () => {
      // When
      const difficulty = Difficulty.easy();

      // Then
      expect(difficulty.level).toBe(2);
    });

    it('medium() 메서드로 보통 난이도를 생성할 수 있다', () => {
      // When
      const difficulty = Difficulty.medium();

      // Then
      expect(difficulty.level).toBe(3);
    });

    it('hard() 메서드로 어려움 난이도를 생성할 수 있다', () => {
      // When
      const difficulty = Difficulty.hard();

      // Then
      expect(difficulty.level).toBe(4);
    });

    it('veryHard() 메서드로 매우 어려움 난이도를 생성할 수 있다', () => {
      // When
      const difficulty = Difficulty.veryHard();

      // Then
      expect(difficulty.level).toBe(5);
    });
  });

  describe('타입 가드', () => {
    it('isDifficultyLevel()으로 유효한 난이도를 검증할 수 있다', () => {
      // Then
      expect(Difficulty.isDifficultyLevel(1)).toBe(true);
      expect(Difficulty.isDifficultyLevel(3)).toBe(true);
      expect(Difficulty.isDifficultyLevel(5)).toBe(true);
      expect(Difficulty.isDifficultyLevel(0)).toBe(false);
      expect(Difficulty.isDifficultyLevel(6)).toBe(false);
      expect(Difficulty.isDifficultyLevel(1.5)).toBe(false);
      expect(Difficulty.isDifficultyLevel(-1)).toBe(false);
    });
  });

  describe('비교 메서드', () => {
    it('isEasierThan()으로 더 쉬운 난이도인지 확인할 수 있다', () => {
      // Given
      const easy = Difficulty.easy();
      const hard = Difficulty.hard();

      // Then
      expect(easy.isEasierThan(hard)).toBe(true);
      expect(hard.isEasierThan(easy)).toBe(false);
    });

    it('isHarderThan()으로 더 어려운 난이도인지 확인할 수 있다', () => {
      // Given
      const easy = Difficulty.easy();
      const hard = Difficulty.hard();

      // Then
      expect(hard.isHarderThan(easy)).toBe(true);
      expect(easy.isHarderThan(hard)).toBe(false);
    });

    it('isSameDifficulty()로 같은 난이도인지 확인할 수 있다', () => {
      // Given
      const medium1 = Difficulty.medium();
      const medium2 = Difficulty.medium();
      const hard = Difficulty.hard();

      // Then
      expect(medium1.isSameDifficulty(medium2)).toBe(true);
      expect(medium1.isSameDifficulty(hard)).toBe(false);
    });
  });

  describe('직렬화/역직렬화', () => {
    it('JSON으로 직렬화할 수 있다', () => {
      // Given
      const difficulty = Difficulty.hard();

      // When
      const json = difficulty.toJSON();

      // Then
      expect(json).toEqual({
        type: 'Difficulty',
        level: 4
      });
    });

    it('JSON에서 역직렬화할 수 있다', () => {
      // Given
      const json = { level: 2 as const };

      // When
      const result = Difficulty.fromJSON(json);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.level).toBe(2);
    });

    it('문자열로 변환할 수 있다', () => {
      // Given
      const difficulty = Difficulty.veryHard();

      // When
      const str = difficulty.toString();

      // Then
      expect(str).toBe('5');
    });

    it('문자열에서 역직렬화할 수 있다', () => {
      // When
      const result = Difficulty.fromString('3');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.level).toBe(3);
    });

    it('잘못된 문자열에서는 역직렬화가 실패한다', () => {
      // When
      const result = Difficulty.fromString('invalid');

      // Then
      expect(result.isSuccess).toBe(false);
    });

    it('Primitive 형태로 변환할 수 있다', () => {
      // Given
      const difficulty = Difficulty.easy();

      // When
      const primitive = difficulty.toPrimitive();

      // Then
      expect(primitive).toBe(2);
    });

    it('Primitive에서 역직렬화할 수 있다', () => {
      // When
      const result = Difficulty.fromPrimitive(4);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.level).toBe(4);
    });
  });

  describe('동등성 검사', () => {
    it('같은 레벨을 가진 Difficulty는 동등하다', () => {
      // Given
      const difficulty1 = Difficulty.medium();
      const difficulty2 = Difficulty.medium();

      // Then
      expect(difficulty1.equals(difficulty2)).toBe(true);
    });

    it('다른 레벨을 가진 Difficulty는 동등하지 않다', () => {
      // Given
      const difficulty1 = Difficulty.easy();
      const difficulty2 = Difficulty.hard();

      // Then
      expect(difficulty1.equals(difficulty2)).toBe(false);
    });
  });

  describe('상수 접근', () => {
    it('LEVELS 상수를 통해 난이도 레벨에 접근할 수 있다', () => {
      // Then
      expect(Difficulty.LEVELS.VERY_EASY).toBe(1);
      expect(Difficulty.LEVELS.EASY).toBe(2);
      expect(Difficulty.LEVELS.MEDIUM).toBe(3);
      expect(Difficulty.LEVELS.HARD).toBe(4);
      expect(Difficulty.LEVELS.VERY_HARD).toBe(5);
    });
  });
});