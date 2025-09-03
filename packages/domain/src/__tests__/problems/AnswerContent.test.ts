// AnswerContent Value Object 테스트
import { describe, it, expect } from 'vitest';
import { AnswerContent, type AnswerContentData } from '../../problems/value-objects/AnswerContent';

describe('AnswerContent Value Object', () => {
  
  describe('점수 유효성 검증', () => {
    it('유효한 점수로 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.points).toBe(10);
    });

    it('음수 점수로는 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        points: -5
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Points cannot be negative');
    });

    it('1000점을 초과하는 점수로는 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        points: 1001
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Points cannot exceed 1000');
    });

    it('유한하지 않은 숫자로는 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        points: Infinity
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Points must be a finite number');
    });
  });

  describe('객관식 답안 (Multiple Choice)', () => {
    it('유효한 객관식 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.MultipleChoice = {
        type: 'multiple_choice',
        correctChoices: ['A', 'C'],
        explanation: '정답은 A와 C입니다.',
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.type).toBe('multiple_choice');
      expect(answer.getCorrectAnswers()).toEqual(['A', 'C']);
      expect(answer.explanation).toBe('정답은 A와 C입니다.');
    });

    it('정답이 없으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.MultipleChoice = {
        type: 'multiple_choice',
        correctChoices: [],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Multiple choice must have at least one correct answer');
    });

    it('중복된 정답이 있으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.MultipleChoice = {
        type: 'multiple_choice',
        correctChoices: ['A', 'B', 'A'],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Correct choices must be unique');
    });
  });

  describe('단답형 답안 (Short Answer)', () => {
    it('유효한 단답형 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.ShortAnswer = {
        type: 'short_answer',
        acceptedAnswers: ['서울', 'Seoul', '서울시'],
        caseSensitive: false,
        trimWhitespace: true,
        points: 5
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.type).toBe('short_answer');
      expect(answer.getCorrectAnswers()).toEqual(['서울', 'Seoul', '서울시']);
      expect(answer.getCaseSensitive()).toBe(false);
      expect(answer.getTrimWhitespace()).toBe(true);
    });

    it('허용 답안이 없으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.ShortAnswer = {
        type: 'short_answer',
        acceptedAnswers: [],
        points: 5
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Short answer must have at least one accepted answer');
    });

    it('빈 문자열 답안이 있으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.ShortAnswer = {
        type: 'short_answer',
        acceptedAnswers: ['유효한답안', '', '   '],
        points: 5
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Accepted answers cannot be empty');
    });
  });

  describe('서술형 답안 (Long Answer)', () => {
    it('유효한 서술형 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.LongAnswer = {
        type: 'long_answer',
        sampleAnswer: '민주주의는 국민이 주권을 가지는 정치 체제입니다.',
        keywords: ['민주주의', '주권', '국민'],
        rubric: [
          { criteria: '내용 정확성', points: 5, description: '개념의 정확한 이해' },
          { criteria: '논리성', points: 3, description: '논리적 전개' }
        ],
        points: 20
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.type).toBe('long_answer');
      expect(answer.getCorrectAnswers()).toBe('민주주의는 국민이 주권을 가지는 정치 체제입니다.');
    });

    it('모든 필드가 선택사항이므로 최소한의 데이터로도 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.LongAnswer = {
        type: 'long_answer',
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('참/거짓 답안 (True/False)', () => {
    it('참 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        explanation: '지구는 실제로 둥글다.',
        points: 2
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.getCorrectAnswers()).toBe(true);
    });

    it('거짓 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: false,
        points: 2
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.getCorrectAnswers()).toBe(false);
    });

    it('boolean이 아닌 값으로는 생성할 수 없다', () => {
      // Given
      const data = {
        type: 'true_false',
        isTrue: 'true' as any, // 문자열
        points: 2
      } as AnswerContent.TrueFalse;

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('True/false answer must be boolean');
    });
  });

  describe('짝맞추기 답안 (Matching)', () => {
    it('유효한 짝맞추기 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.Matching = {
        type: 'matching',
        correctMatches: [
          { leftId: 'country1', rightId: 'capital1' },
          { leftId: 'country2', rightId: 'capital2' },
          { leftId: 'country3', rightId: 'capital3' }
        ],
        allowsPartialCredit: true,
        points: 15
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.type).toBe('matching');
      expect(answer.allowsPartialCredit).toBe(true);
      expect(answer.getCorrectAnswers()).toEqual(data.correctMatches);
    });

    it('매칭이 없으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.Matching = {
        type: 'matching',
        correctMatches: [],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Matching must have at least one correct match');
    });

    it('같은 leftId가 중복되면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.Matching = {
        type: 'matching',
        correctMatches: [
          { leftId: 'item1', rightId: 'match1' },
          { leftId: 'item1', rightId: 'match2' } // 중복
        ],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Each left item can only match once');
    });
  });

  describe('빈칸채우기 답안 (Fill Blank)', () => {
    it('유효한 빈칸채우기 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.FillBlank = {
        type: 'fill_blank',
        blanks: [
          { id: 'blank1', acceptedAnswers: ['서울', 'Seoul'] },
          { id: 'blank2', acceptedAnswers: ['1000', '천'], caseSensitive: false }
        ],
        allowsPartialCredit: true,
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.allowsPartialCredit).toBe(true);
      expect(answer.getCorrectAnswers()).toEqual(data.blanks);
    });

    it('빈칸이 없으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.FillBlank = {
        type: 'fill_blank',
        blanks: [],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Fill blank must have at least one blank answer');
    });

    it('빈칸 ID가 없으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.FillBlank = {
        type: 'fill_blank',
        blanks: [
          { id: '', acceptedAnswers: ['답안'] }
        ],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Each blank must have a valid ID');
    });

    it('빈칸의 허용 답안이 없으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.FillBlank = {
        type: 'fill_blank',
        blanks: [
          { id: 'blank1', acceptedAnswers: [] }
        ],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Blank blank1 must have at least one accepted answer');
    });

    it('빈칸 ID가 중복되면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.FillBlank = {
        type: 'fill_blank',
        blanks: [
          { id: 'blank1', acceptedAnswers: ['답안1'] },
          { id: 'blank1', acceptedAnswers: ['답안2'] } // 중복 ID
        ],
        points: 10
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Blank IDs must be unique');
    });
  });

  describe('순서배열 답안 (Ordering)', () => {
    it('유효한 순서배열 답안을 생성할 수 있다', () => {
      // Given
      const data: AnswerContent.Ordering = {
        type: 'ordering',
        correctOrder: ['item1', 'item2', 'item3', 'item4'],
        allowsPartialCredit: true,
        points: 8
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(true);
      const answer = result.value!;
      expect(answer.allowsPartialCredit).toBe(true);
      expect(answer.getCorrectAnswers()).toEqual(['item1', 'item2', 'item3', 'item4']);
    });

    it('항목이 2개 미만이면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.Ordering = {
        type: 'ordering',
        correctOrder: ['item1'],
        points: 5
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Ordering must have at least 2 items');
    });

    it('중복된 항목이 있으면 생성할 수 없다', () => {
      // Given
      const data: AnswerContent.Ordering = {
        type: 'ordering',
        correctOrder: ['item1', 'item2', 'item1'], // 중복
        points: 5
      };

      // When
      const result = AnswerContent.create(data);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Order items must be unique');
    });
  });

  describe('부분 점수 허용 여부', () => {
    it('부분 점수를 허용하지 않는 타입은 false를 반환한다', () => {
      // Given
      const data: AnswerContent.MultipleChoice = {
        type: 'multiple_choice',
        correctChoices: ['A'],
        points: 10
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const allowsPartial = answer.allowsPartialCredit;

      // Then
      expect(allowsPartial).toBe(false);
    });

    it('부분 점수를 허용하는 타입에서 설정값을 반환한다', () => {
      // Given
      const data1: AnswerContent.Matching = {
        type: 'matching',
        correctMatches: [{ leftId: 'l1', rightId: 'r1' }],
        allowsPartialCredit: true,
        points: 10
      };

      const data2: AnswerContent.Matching = {
        type: 'matching',
        correctMatches: [{ leftId: 'l1', rightId: 'r1' }],
        allowsPartialCredit: false,
        points: 10
      };

      // When
      const answer1 = AnswerContent.create(data1).value!;
      const answer2 = AnswerContent.create(data2).value!;

      // Then
      expect(answer1.allowsPartialCredit).toBe(true);
      expect(answer2.allowsPartialCredit).toBe(false);
    });
  });

  describe('옵션 접근자', () => {
    it('caseSensitive 옵션을 올바르게 반환한다', () => {
      // Given
      const data: AnswerContent.ShortAnswer = {
        type: 'short_answer',
        acceptedAnswers: ['답안'],
        caseSensitive: true,
        points: 5
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const caseSensitive = answer.getCaseSensitive();

      // Then
      expect(caseSensitive).toBe(true);
    });

    it('caseSensitive 옵션이 없는 타입에서는 undefined를 반환한다', () => {
      // Given
      const data: AnswerContent.MultipleChoice = {
        type: 'multiple_choice',
        correctChoices: ['A'],
        points: 10
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const caseSensitive = answer.getCaseSensitive();

      // Then
      expect(caseSensitive).toBeUndefined();
    });

    it('trimWhitespace 옵션을 올바르게 반환한다', () => {
      // Given
      const data: AnswerContent.ShortAnswer = {
        type: 'short_answer',
        acceptedAnswers: ['답안'],
        trimWhitespace: false,
        points: 5
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const trimWhitespace = answer.getTrimWhitespace();

      // Then
      expect(trimWhitespace).toBe(false);
    });
  });

  describe('직렬화/역직렬화', () => {
    it('JSON으로 직렬화할 수 있다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        points: 5
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const json = answer.toJSON();

      // Then
      expect(json).toEqual({
        type: 'AnswerContent',
        data: data
      });
    });

    it('JSON에서 역직렬화할 수 있다', () => {
      // Given
      const data: AnswerContent.ShortAnswer = {
        type: 'short_answer',
        acceptedAnswers: ['서울'],
        points: 5
      };
      const json = { data };

      // When
      const result = AnswerContent.fromJSON(json);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type).toBe('short_answer');
    });

    it('Primitive 형태로 변환할 수 있다', () => {
      // Given
      const data: AnswerContent.MultipleChoice = {
        type: 'multiple_choice',
        correctChoices: ['A', 'B'],
        points: 10
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const primitive = answer.toPrimitive();

      // Then
      expect(primitive).toEqual(data);
    });

    it('Primitive에서 역직렬화할 수 있다', () => {
      // Given
      const data: AnswerContent.Ordering = {
        type: 'ordering',
        correctOrder: ['first', 'second', 'third'],
        points: 12
      };

      // When
      const result = AnswerContent.fromPrimitive(data);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.getCorrectAnswers()).toEqual(['first', 'second', 'third']);
    });
  });

  describe('데이터 접근', () => {
    it('data getter로 전체 데이터에 접근할 수 있다', () => {
      // Given
      const data: AnswerContent.FillBlank = {
        type: 'fill_blank',
        blanks: [{ id: 'blank1', acceptedAnswers: ['답안'] }],
        points: 5
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const retrievedData = answer.data;

      // Then
      expect(retrievedData).toEqual(data);
    });

    it('설명이 없으면 undefined를 반환한다', () => {
      // Given
      const data: AnswerContent.TrueFalse = {
        type: 'true_false',
        isTrue: true,
        points: 2
      };
      const answer = AnswerContent.create(data).value!;

      // When
      const explanation = answer.explanation;

      // Then
      expect(explanation).toBeUndefined();
    });
  });
});