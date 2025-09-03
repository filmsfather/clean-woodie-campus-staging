// Problem Entity 테스트
import { describe, it, expect, beforeEach } from 'vitest';
import { Problem } from '../../problems/entities/Problem';
import { ProblemType } from '../../problems/value-objects/ProblemType';
import { Difficulty } from '../../problems/value-objects/Difficulty';
import { Tag } from '../../problems/value-objects/Tag';
import { ProblemContent } from '../../problems/value-objects/ProblemContent';
import { AnswerContent } from '../../problems/value-objects/AnswerContent';
import { UniqueEntityID } from '../../common/Identifier';

describe('Problem Entity', () => {
  
  describe('생성 테스트', () => {
    it('유효한 데이터로 객관식 문제를 생성할 수 있다', () => {
      // Given
      const teacherId = new UniqueEntityID();
      const difficulty = Difficulty.medium();
      const tags = [Tag.create('수학').value!, Tag.create('기초').value!];
      
      const content = ProblemContent.create({
        type: 'multiple_choice',
        title: '2 + 2 = ?',
        description: '다음 계산 결과를 선택하세요',
        choices: [
          { id: 'A', text: '3' },
          { id: 'B', text: '4' },
          { id: 'C', text: '5' },
          { id: 'D', text: '6' }
        ]
      }).value!;

      const answer = AnswerContent.create({
        type: 'multiple_choice',
        correctChoices: ['B'],
        points: 10
      }).value!;

      // When
      const result = Problem.create({
        teacherId: teacherId.toString(),
        content,
        correctAnswer: answer,
        difficulty,
        tags
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const problem = result.value!;
      expect(problem.teacherId).toBe(teacherId.toString());
      expect(problem.type.value).toBe('multiple_choice');
      expect(problem.difficulty.level).toBe(3);
      expect(problem.tags).toHaveLength(2);
      expect(problem.isActive).toBe(true);
    });

    it('단답형 문제를 생성할 수 있다', () => {
      // Given
      const teacherId = new UniqueEntityID();
      const content = ProblemContent.create({
        type: 'short_answer',
        title: '한국의 수도는?',
        description: '한국의 수도를 입력하세요',
        placeholder: '수도 이름을 입력하세요'
      }).value!;

      const answer = AnswerContent.create({
        type: 'short_answer',
        acceptedAnswers: ['서울', 'Seoul', '서울시'],
        points: 5
      }).value!;

      // When
      const result = Problem.create({
        teacherId: teacherId.toString(),
        content,
        correctAnswer: answer,
        difficulty: Difficulty.easy(),
        tags: [Tag.create('지리').value!]
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const problem = result.value!;
      expect(problem.type.value).toBe('short_answer');
      expect(problem.difficulty.level).toBe(2);
    });

    it('서술형 문제를 생성할 수 있다', () => {
      // Given
      const teacherId = new UniqueEntityID();
      const content = ProblemContent.create({
        type: 'long_answer',
        title: '민주주의의 특징을 설명하시오',
        description: '민주주의의 주요 특징과 장점에 대해 서술하세요',
        minLength: 100,
        maxLength: 500
      }).value!;

      const answer = AnswerContent.create({
        type: 'long_answer',
        sampleAnswer: '민주주의는 국민이 주권을 가지는 정치 체제입니다.',
        rubric: [
          { criteria: '내용 정확성', points: 8, description: '개념 이해도' },
          { criteria: '논리성', points: 6, description: '논리적 전개' },
          { criteria: '창의성', points: 6, description: '독창적 사고' }
        ],
        points: 20
      }).value!;

      // When
      const result = Problem.create({
        teacherId: teacherId.toString(),
        content,
        correctAnswer: answer,
        difficulty: Difficulty.hard(),
        tags: [Tag.create('사회').value!, Tag.create('서술').value!]
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const problem = result.value!;
      expect(problem.type.value).toBe('long_answer');
      expect(problem.difficulty.level).toBe(4);
    });

    it('잘못된 데이터로는 문제 생성이 실패한다', () => {
      // Given
      const teacherId = new UniqueEntityID();
      const contentResult = ProblemContent.create({
        type: 'multiple_choice',
        title: '', // 빈 제목
        description: '설명',
        choices: [
          { id: 'A', text: '답1' }
        ]
      });

      // ProblemContent 생성이 실패해야 함
      expect(contentResult.isSuccess).toBe(false);
    });
  });

  describe('비즈니스 로직 테스트', () => {
    let problem: Problem;

    beforeEach(() => {
      const teacherId = new UniqueEntityID();
      const content = ProblemContent.create({
        type: 'multiple_choice',
        title: '테스트 문제',
        description: '테스트용 문제입니다',
        choices: [
          { id: 'A', text: '답1' },
          { id: 'B', text: '답2' },
          { id: 'C', text: '답3' },
          { id: 'D', text: '답4' }
        ]
      }).value!;

      const answer = AnswerContent.create({
        type: 'multiple_choice',
        correctChoices: ['B', 'C'],
        points: 10
      }).value!;

      problem = Problem.create({
        teacherId: teacherId.toString(),
        content,
        correctAnswer: answer,
        difficulty: Difficulty.medium(),
        tags: [Tag.create('테스트').value!]
      }).value!;
    });

    it('문제를 비활성화할 수 있다', () => {
      // When
      const result = problem.deactivate();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(problem.isActive).toBe(false);
    });

    it('문제를 활성화할 수 있다', () => {
      // Given
      const deactivateResult = problem.deactivate();
      expect(deactivateResult.isSuccess).toBe(true);
      
      // When
      const activateResult = problem.activate();

      // Then
      expect(activateResult.isSuccess).toBe(true);
      expect(problem.isActive).toBe(true);
    });

    it('태그를 추가할 수 있다', () => {
      // Given
      const newTag = Tag.create('새로운태그').value!;
      const initialTagCount = problem.tags.length;

      // When
      const result = problem.addTag(newTag);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(problem.tags).toHaveLength(initialTagCount + 1);
      expect(problem.tags.some(tag => tag.name === '새로운태그')).toBe(true);
    });

    it('중복 태그는 추가되지 않는다', () => {
      // Given
      const existingTag = problem.tags[0];
      const initialTagCount = problem.tags.length;

      // When
      const result = problem.addTag(existingTag);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(problem.tags).toHaveLength(initialTagCount);
    });

    it('태그를 제거할 수 있다', () => {
      // Given
      const tagToRemoveName = problem.tags[0].name;
      const initialTagCount = problem.tags.length;

      // When
      const result = problem.removeTag(tagToRemoveName);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(problem.tags).toHaveLength(initialTagCount - 1);
      expect(problem.tags.some(tag => tag.name === tagToRemoveName)).toBe(false);
    });

    it('난이도를 변경할 수 있다', () => {
      // Given
      const newDifficulty = Difficulty.hard();

      // When
      const result = problem.changeDifficulty(newDifficulty);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(problem.difficulty.level).toBe(4);
    });

    it('콘텐츠를 업데이트할 수 있다', () => {
      // Given
      const newContent = ProblemContent.create({
        type: 'multiple_choice',
        title: '업데이트된 제목',
        description: '업데이트된 설명',
        choices: [
          { id: 'A', text: '새답1' },
          { id: 'B', text: '새답2' },
          { id: 'C', text: '새답3' },
          { id: 'D', text: '새답4' }
        ]
      }).value!;

      // When
      const result = problem.updateContent(newContent);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(problem.content.title).toBe('업데이트된 제목');
    });
  });

  describe('기본 속성 테스트', () => {
    it('문제 생성 시 기본 속성이 올바르게 설정된다', () => {
      // Given
      const teacherId = new UniqueEntityID();
      const content = ProblemContent.create({
        type: 'true_false',
        title: '지구는 둥글다',
        description: '다음 문장이 참인지 거짓인지 선택하세요',
        statement: '지구는 둥글다'
      }).value!;

      const answer = AnswerContent.create({
        type: 'true_false',
        isTrue: true,
        points: 5
      }).value!;

      // When
      const problem = Problem.create({
        teacherId: teacherId.toString(),
        content,
        correctAnswer: answer,
        difficulty: Difficulty.easy(),
        tags: [Tag.create('과학').value!]
      }).value!;

      // Then
      expect(problem.teacherId).toBe(teacherId.toString());
      expect(problem.content.title).toBe('지구는 둥글다');
      expect(problem.correctAnswer.points).toBe(5);
      expect(problem.difficulty.level).toBe(2);
      expect(problem.tags).toHaveLength(1);
      expect(problem.tags[0].name).toBe('과학');
      expect(problem.isActive).toBe(true);
      expect(problem.createdAt).toBeInstanceOf(Date);
      expect(problem.updatedAt).toBeInstanceOf(Date);
    });
  });
});