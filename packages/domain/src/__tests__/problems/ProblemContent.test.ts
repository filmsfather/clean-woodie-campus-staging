// ProblemContent Value Object 테스트
import { describe, it, expect } from 'vitest';
import { ProblemContent } from '../../problems/value-objects/ProblemContent';
import type { 
  MultipleChoiceContent,
  ShortAnswerContent,
  LongAnswerContent,
  TrueFalseContent,
  MatchingContent,
  FillBlankContent,
  OrderingContent
} from '../../problems/value-objects/ProblemContent';

describe('ProblemContent Value Object', () => {
  
  describe('기본 필드 검증', () => {
    it('빈 제목으로는 생성할 수 없다', () => {
      // Given
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '',
        choices: [
          { id: '1', text: '선택지 1' },
          { id: '2', text: '선택지 2' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Problem title is required');
    });

    it('200자를 초과하는 제목으로는 생성할 수 없다', () => {
      // Given
      const longTitle = 'a'.repeat(201);
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: longTitle,
        choices: [
          { id: '1', text: '선택지 1' },
          { id: '2', text: '선택지 2' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Problem title cannot exceed 200 characters');
    });
  });

  describe('객관식 문제 (Multiple Choice)', () => {
    it('유효한 객관식 문제를 생성할 수 있다', () => {
      // Given
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '다음 중 올바른 답을 선택하세요',
        description: '객관식 문제 설명',
        choices: [
          { id: '1', text: '선택지 1', explanation: '설명 1' },
          { id: '2', text: '선택지 2', explanation: '설명 2' },
          { id: '3', text: '선택지 3' },
          { id: '4', text: '선택지 4' }
        ],
        allowMultiple: false
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      const problemContent = result.value!;
      expect(problemContent.type.value).toBe('multiple_choice');
      expect(problemContent.title).toBe('다음 중 올바른 답을 선택하세요');
      expect(problemContent.description).toBe('객관식 문제 설명');
    });

    it('선택지가 2개 미만이면 생성할 수 없다', () => {
      // Given
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '테스트 문제',
        choices: [
          { id: '1', text: '선택지 1' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Multiple choice must have at least 2 choices');
    });

    it('선택지가 10개를 초과하면 생성할 수 없다', () => {
      // Given
      const choices = Array.from({ length: 11 }, (_, i) => ({
        id: (i + 1).toString(),
        text: `선택지 ${i + 1}`
      }));

      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '테스트 문제',
        choices
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Multiple choice cannot have more than 10 choices');
    });

    it('중복된 선택지가 있으면 생성할 수 없다', () => {
      // Given
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '테스트 문제',
        choices: [
          { id: '1', text: '같은 선택지' },
          { id: '2', text: '같은 선택지' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Choice options must be unique');
    });
  });

  describe('단답형 문제 (Short Answer)', () => {
    it('유효한 단답형 문제를 생성할 수 있다', () => {
      // Given
      const content: ShortAnswerContent = {
        type: 'short_answer',
        title: '다음 질문에 답하세요',
        description: '단답형 문제 설명',
        placeholder: '답을 입력하세요',
        maxLength: 100,
        caseSensitive: false
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('short_answer');
    });

    it('최대 길이가 1000자를 초과하면 생성할 수 없다', () => {
      // Given
      const content: ShortAnswerContent = {
        type: 'short_answer',
        title: '테스트 문제',
        maxLength: 1001
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Short answer max length cannot exceed 1000 characters');
    });
  });

  describe('서술형 문제 (Long Answer)', () => {
    it('유효한 서술형 문제를 생성할 수 있다', () => {
      // Given
      const content: LongAnswerContent = {
        type: 'long_answer',
        title: '다음 주제에 대해 서술하세요',
        description: '서술형 문제 설명',
        placeholder: '자세히 답변해주세요',
        minLength: 100,
        maxLength: 500,
        rubric: [
          { criteria: '내용 정확성', description: '정확한 내용', points: 5 },
          { criteria: '논리성', description: '논리적 전개', points: 3 }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('long_answer');
    });

    it('최소 길이가 최대 길이보다 크면 생성할 수 없다', () => {
      // Given
      const content: LongAnswerContent = {
        type: 'long_answer',
        title: '테스트 문제',
        minLength: 500,
        maxLength: 100
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Long answer min length cannot be greater than max length');
    });
  });

  describe('참/거짓 문제 (True/False)', () => {
    it('유효한 참/거짓 문제를 생성할 수 있다', () => {
      // Given
      const content: TrueFalseContent = {
        type: 'true_false',
        title: '다음 문장의 참/거짓을 판단하세요',
        description: '참/거짓 문제 설명',
        statement: '지구는 둥글다'
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('true_false');
    });

    it('문장이 없으면 생성할 수 없다', () => {
      // Given
      const content: TrueFalseContent = {
        type: 'true_false',
        title: '테스트 문제',
        statement: ''
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('True/false statement is required');
    });
  });

  describe('짝맞추기 문제 (Matching)', () => {
    it('유효한 짝맞추기 문제를 생성할 수 있다', () => {
      // Given
      const content: MatchingContent = {
        type: 'matching',
        title: '다음 항목들을 올바르게 연결하세요',
        description: '짝맞추기 문제 설명',
        leftItems: [
          { id: 'l1', text: '한국' },
          { id: 'l2', text: '일본' },
          { id: 'l3', text: '중국' }
        ],
        rightItems: [
          { id: 'r1', text: '서울' },
          { id: 'r2', text: '도쿄' },
          { id: 'r3', text: '베이징' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('matching');
    });

    it('왼쪽 항목이 2개 미만이면 생성할 수 없다', () => {
      // Given
      const content: MatchingContent = {
        type: 'matching',
        title: '테스트 문제',
        leftItems: [
          { id: 'l1', text: '항목 1' }
        ],
        rightItems: [
          { id: 'r1', text: '답 1' },
          { id: 'r2', text: '답 2' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Matching must have at least 2 left items');
    });
  });

  describe('빈칸채우기 문제 (Fill Blank)', () => {
    it('유효한 빈칸채우기 문제를 생성할 수 있다', () => {
      // Given
      const content: FillBlankContent = {
        type: 'fill_blank',
        title: '다음 빈칸을 채우세요',
        description: '빈칸채우기 문제 설명',
        text: '대한민국의 수도는 __blank__이고, 인구는 약 __blank__만 명입니다.',
        blanks: [
          { id: 'blank1', placeholder: '도시명' },
          { id: 'blank2', placeholder: '숫자', maxLength: 10 }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('fill_blank');
    });

    it('텍스트가 없으면 생성할 수 없다', () => {
      // Given
      const content: FillBlankContent = {
        type: 'fill_blank',
        title: '테스트 문제',
        text: '',
        blanks: []
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Fill blank text is required');
    });

    it('빈칸이 없으면 생성할 수 없다', () => {
      // Given
      const content: FillBlankContent = {
        type: 'fill_blank',
        title: '테스트 문제',
        text: '빈칸이 없는 텍스트입니다.',
        blanks: []
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Fill blank must contain at least one __blank__ placeholder');
    });

    it('빈칸 수와 blanks 배열 길이가 일치하지 않으면 생성할 수 없다', () => {
      // Given
      const content: FillBlankContent = {
        type: 'fill_blank',
        title: '테스트 문제',
        text: '첫 번째 __blank__와 두 번째 __blank__입니다.',
        blanks: [
          { id: 'blank1', placeholder: '첫 번째' }
          // 두 번째 빈칸 정의 누락
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Number of blanks must match blank placeholders in text');
    });
  });

  describe('순서배열 문제 (Ordering)', () => {
    it('유효한 순서배열 문제를 생성할 수 있다', () => {
      // Given
      const content: OrderingContent = {
        type: 'ordering',
        title: '다음 항목들을 올바른 순서로 배열하세요',
        description: '순서배열 문제 설명',
        instructions: '시간 순으로 배열해주세요',
        items: [
          { id: '1', text: '아침 식사' },
          { id: '2', text: '점심 식사' },
          { id: '3', text: '저녁 식사' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('ordering');
    });

    it('항목이 2개 미만이면 생성할 수 없다', () => {
      // Given
      const content: OrderingContent = {
        type: 'ordering',
        title: '테스트 문제',
        items: [
          { id: '1', text: '항목 1' }
        ]
      };

      // When
      const result = ProblemContent.create(content);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Ordering must have at least 2 items');
    });
  });

  describe('직렬화/역직렬화', () => {
    it('JSON으로 직렬화할 수 있다', () => {
      // Given
      const content: ShortAnswerContent = {
        type: 'short_answer',
        title: '테스트 문제',
        placeholder: '답을 입력하세요'
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const json = problemContent.toJSON();

      // Then
      expect(json).toEqual({
        type: 'ProblemContent',
        data: content
      });
    });

    it('JSON에서 역직렬화할 수 있다', () => {
      // Given
      const content: TrueFalseContent = {
        type: 'true_false',
        title: '테스트 문제',
        statement: '테스트 문장'
      };
      const json = { data: content };

      // When
      const result = ProblemContent.fromJSON(json);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type.value).toBe('true_false');
    });

    it('Primitive 형태로 변환할 수 있다', () => {
      // Given
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '테스트 문제',
        choices: [
          { id: '1', text: '선택지 1' },
          { id: '2', text: '선택지 2' }
        ]
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const primitive = problemContent.toPrimitive();

      // Then
      expect(primitive).toEqual(content);
    });
  });

  describe('콘텐츠 업데이트', () => {
    it('제목을 업데이트할 수 있다', () => {
      // Given
      const content: ShortAnswerContent = {
        type: 'short_answer',
        title: '원래 제목',
        placeholder: '답 입력'
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const result = problemContent.updateTitle('새로운 제목');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe('새로운 제목');
    });

    it('설명을 업데이트할 수 있다', () => {
      // Given
      const content: LongAnswerContent = {
        type: 'long_answer',
        title: '테스트 문제'
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const result = problemContent.updateDescription('새로운 설명');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBe('새로운 설명');
    });

    it('잘못된 제목으로 업데이트하면 실패한다', () => {
      // Given
      const content: ShortAnswerContent = {
        type: 'short_answer',
        title: '원래 제목'
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const result = problemContent.updateTitle('');

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Problem title is required');
    });
  });

  describe('첨부파일', () => {
    it('첨부파일이 없으면 빈 배열을 반환한다', () => {
      // Given
      const content: ShortAnswerContent = {
        type: 'short_answer',
        title: '테스트 문제'
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const attachments = problemContent.attachments;

      // Then
      expect(attachments).toEqual([]);
    });

    it('첨부파일이 있으면 올바르게 반환한다', () => {
      // Given
      const content: MultipleChoiceContent = {
        type: 'multiple_choice',
        title: '테스트 문제',
        attachments: ['file1.jpg', 'file2.pdf'],
        choices: [
          { id: '1', text: '선택지 1' },
          { id: '2', text: '선택지 2' }
        ]
      };
      const problemContent = ProblemContent.create(content).value!;

      // When
      const attachments = problemContent.attachments;

      // Then
      expect(attachments).toEqual(['file1.jpg', 'file2.pdf']);
    });
  });
});