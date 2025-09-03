// ProblemType Value Object 테스트
import { describe, it, expect } from 'vitest';
import { ProblemType } from '../../problems/value-objects/ProblemType';

describe('ProblemType Value Object', () => {
  
  describe('생성 및 유효성 검증', () => {
    it('유효한 문제 유형으로 생성할 수 있다', () => {
      // When
      const result = ProblemType.create('multiple_choice');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.value).toBe('multiple_choice');
    });

    it('잘못된 문제 유형으로는 생성할 수 없다', () => {
      // When
      const result = ProblemType.create('invalid_type');

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Invalid problem type');
    });

    it('빈 문자열로는 생성할 수 없다', () => {
      // When
      const result = ProblemType.create('');

      // Then
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('정적 팩토리 메서드', () => {
    it('multipleChoice() 메서드로 객관식 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.multipleChoice();

      // Then
      expect(type.value).toBe('multiple_choice');
    });

    it('shortAnswer() 메서드로 단답식 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.shortAnswer();

      // Then
      expect(type.value).toBe('short_answer');
    });

    it('longAnswer() 메서드로 서술형 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.longAnswer();

      // Then
      expect(type.value).toBe('long_answer');
    });

    it('trueFalse() 메서드로 참/거짓 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.trueFalse();

      // Then
      expect(type.value).toBe('true_false');
    });

    it('matching() 메서드로 짝맞추기 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.matching();

      // Then
      expect(type.value).toBe('matching');
    });

    it('fillBlank() 메서드로 빈칸채우기 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.fillBlank();

      // Then
      expect(type.value).toBe('fill_blank');
    });

    it('ordering() 메서드로 순서배열 유형을 생성할 수 있다', () => {
      // When
      const type = ProblemType.ordering();

      // Then
      expect(type.value).toBe('ordering');
    });
  });

  describe('타입 가드', () => {
    it('isProblemType()으로 유효한 타입을 검증할 수 있다', () => {
      // Then
      expect(ProblemType.isProblemType('multiple_choice')).toBe(true);
      expect(ProblemType.isProblemType('short_answer')).toBe(true);
      expect(ProblemType.isProblemType('invalid_type')).toBe(false);
      expect(ProblemType.isProblemType('')).toBe(false);
    });
  });

  describe('직렬화/역직렬화', () => {
    it('JSON으로 직렬화할 수 있다', () => {
      // Given
      const type = ProblemType.multipleChoice();

      // When
      const json = type.toJSON();

      // Then
      expect(json).toEqual({
        type: 'ProblemType',
        value: 'multiple_choice'
      });
    });

    it('JSON에서 역직렬화할 수 있다', () => {
      // Given
      const json = { value: 'short_answer' as const };

      // When
      const result = ProblemType.fromJSON(json);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.value).toBe('short_answer');
    });

    it('문자열로 변환할 수 있다', () => {
      // Given
      const type = ProblemType.longAnswer();

      // When
      const str = type.toString();

      // Then
      expect(str).toBe('long_answer');
    });

    it('문자열에서 역직렬화할 수 있다', () => {
      // When
      const result = ProblemType.fromString('true_false');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.value).toBe('true_false');
    });

    it('Primitive 형태로 변환할 수 있다', () => {
      // Given
      const type = ProblemType.matching();

      // When
      const primitive = type.toPrimitive();

      // Then
      expect(primitive).toBe('matching');
    });

    it('Primitive에서 역직렬화할 수 있다', () => {
      // When
      const result = ProblemType.fromPrimitive('fill_blank');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.value).toBe('fill_blank');
    });
  });

  describe('동등성 검사', () => {
    it('같은 값을 가진 ProblemType은 동등하다', () => {
      // Given
      const type1 = ProblemType.multipleChoice();
      const type2 = ProblemType.multipleChoice();

      // Then
      expect(type1.equals(type2)).toBe(true);
    });

    it('다른 값을 가진 ProblemType은 동등하지 않다', () => {
      // Given
      const type1 = ProblemType.multipleChoice();
      const type2 = ProblemType.shortAnswer();

      // Then
      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('상수 접근', () => {
    it('TYPES 상수를 통해 모든 문제 유형에 접근할 수 있다', () => {
      // Then
      expect(ProblemType.TYPES.MULTIPLE_CHOICE).toBe('multiple_choice');
      expect(ProblemType.TYPES.SHORT_ANSWER).toBe('short_answer');
      expect(ProblemType.TYPES.LONG_ANSWER).toBe('long_answer');
      expect(ProblemType.TYPES.TRUE_FALSE).toBe('true_false');
      expect(ProblemType.TYPES.MATCHING).toBe('matching');
      expect(ProblemType.TYPES.FILL_BLANK).toBe('fill_blank');
      expect(ProblemType.TYPES.ORDERING).toBe('ordering');
    });
  });
});