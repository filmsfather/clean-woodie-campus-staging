import { describe, it, expect, beforeEach } from 'vitest';
import { ProblemSet } from '../../problemSets/entities/ProblemSet';
import { ProblemSetTitle } from '../../problemSets/value-objects/ProblemSetTitle';
import { ProblemSetDescription } from '../../problemSets/value-objects/ProblemSetDescription';
import { UniqueEntityID } from '../../common/Identifier';

describe('ProblemSet', () => {
  let validTitle: ProblemSetTitle;
  let validDescription: ProblemSetDescription;
  let teacherId: string;
  let problemId1: UniqueEntityID;
  let problemId2: UniqueEntityID;
  let problemId3: UniqueEntityID;

  beforeEach(() => {
    const titleResult = ProblemSetTitle.create('수학 기본 문제집');
    const descriptionResult = ProblemSetDescription.create('중학교 1학년 수학 기본 개념 문제집');
    
    if (titleResult.isFailure || descriptionResult.isFailure) {
      throw new Error('테스트 설정 실패');
    }
    
    validTitle = titleResult.value;
    validDescription = descriptionResult.value;
    teacherId = 'teacher-123';
    problemId1 = new UniqueEntityID('problem-1');
    problemId2 = new UniqueEntityID('problem-2'); 
    problemId3 = new UniqueEntityID('problem-3');
  });

  describe('생성', () => {
    it('유효한 정보로 문제집을 생성할 수 있다', () => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle,
        description: validDescription
      });

      expect(result.isSuccess).toBe(true);
      const problemSet = result.value;
      expect(problemSet.teacherId).toBe(teacherId);
      expect(problemSet.title).toBe(validTitle);
      expect(problemSet.description).toBe(validDescription);
      expect(problemSet.isEmpty()).toBe(true);
      expect(problemSet.itemCount).toBe(0);
    });

    it('설명 없이도 문제집을 생성할 수 있다', () => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });

      expect(result.isSuccess).toBe(true);
      const problemSet = result.value;
      expect(problemSet.description).toBeUndefined();
    });

    it('교사 ID가 비어있으면 생성에 실패한다', () => {
      const result = ProblemSet.create({
        teacherId: '',
        title: validTitle
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Teacher ID is required');
    });

    it('제목이 비어있으면 생성에 실패한다', () => {
      const emptyTitleResult = ProblemSetTitle.create('');
      expect(emptyTitleResult.isFailure).toBe(true);
    });
  });

  describe('문제 추가', () => {
    let problemSet: ProblemSet;

    beforeEach(() => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });
      problemSet = result.value;
    });

    it('문제집에 문제를 추가할 수 있다', () => {
      const result = problemSet.addProblem(problemId1);

      expect(result.isSuccess).toBe(true);
      expect(problemSet.itemCount).toBe(1);
      expect(problemSet.containsProblem(problemId1)).toBe(true);
      expect(problemSet.getProblemPosition(problemId1)).toBe(0);
      expect(problemSet.isEmpty()).toBe(false);
    });

    it('여러 문제를 순서대로 추가할 수 있다', () => {
      problemSet.addProblem(problemId1);
      problemSet.addProblem(problemId2);
      problemSet.addProblem(problemId3);

      expect(problemSet.itemCount).toBe(3);
      expect(problemSet.getProblemPosition(problemId1)).toBe(0);
      expect(problemSet.getProblemPosition(problemId2)).toBe(1);
      expect(problemSet.getProblemPosition(problemId3)).toBe(2);

      const orderedIds = problemSet.getProblemIds();
      expect(orderedIds[0]).toEqual(problemId1);
      expect(orderedIds[1]).toEqual(problemId2);
      expect(orderedIds[2]).toEqual(problemId3);
    });

    it('특정 위치에 문제를 삽입할 수 있다', () => {
      problemSet.addProblem(problemId1);
      problemSet.addProblem(problemId3);
      
      // 인덱스 1 위치에 problemId2 삽입
      const result = problemSet.addProblem(problemId2, 1);

      expect(result.isSuccess).toBe(true);
      expect(problemSet.itemCount).toBe(3);
      expect(problemSet.getProblemPosition(problemId1)).toBe(0);
      expect(problemSet.getProblemPosition(problemId2)).toBe(1);
      expect(problemSet.getProblemPosition(problemId3)).toBe(2);
    });

    it('중복된 문제는 추가할 수 없다', () => {
      problemSet.addProblem(problemId1);
      const result = problemSet.addProblem(problemId1);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Problem already exists');
      expect(problemSet.itemCount).toBe(1);
    });

    it('잘못된 인덱스로 문제 추가 시 실패한다', () => {
      const result1 = problemSet.addProblem(problemId1, -1);
      const result2 = problemSet.addProblem(problemId1, 10);

      expect(result1.isFailure).toBe(true);
      expect(result2.isFailure).toBe(true);
      expect(result1.error).toContain('Invalid order index');
      expect(result2.error).toContain('Invalid order index');
    });

    it('문제 추가 시 도메인 이벤트가 발생한다', () => {
      problemSet.addProblem(problemId1);

      const events = problemSet.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      
      const itemCreatedEvent = events.find(e => e.eventType === 'ProblemSetItemCreated');
      expect(itemCreatedEvent).toBeDefined();
    });
  });

  describe('문제 제거', () => {
    let problemSet: ProblemSet;

    beforeEach(() => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });
      problemSet = result.value;
      problemSet.addProblem(problemId1);
      problemSet.addProblem(problemId2);
      problemSet.addProblem(problemId3);
    });

    it('문제집에서 문제를 제거할 수 있다', () => {
      const result = problemSet.removeProblem(problemId2);

      expect(result.isSuccess).toBe(true);
      expect(problemSet.itemCount).toBe(2);
      expect(problemSet.containsProblem(problemId2)).toBe(false);
      expect(problemSet.containsProblem(problemId1)).toBe(true);
      expect(problemSet.containsProblem(problemId3)).toBe(true);
    });

    it('문제 제거 후 순서가 재조정된다', () => {
      problemSet.removeProblem(problemId1); // 첫 번째 문제 제거

      expect(problemSet.getProblemPosition(problemId2)).toBe(0);
      expect(problemSet.getProblemPosition(problemId3)).toBe(1);

      const orderedIds = problemSet.getProblemIds();
      expect(orderedIds[0]).toEqual(problemId2);
      expect(orderedIds[1]).toEqual(problemId3);
    });

    it('존재하지 않는 문제 제거 시 실패한다', () => {
      const nonExistentId = new UniqueEntityID('non-existent');
      const result = problemSet.removeProblem(nonExistentId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Problem not found');
      expect(problemSet.itemCount).toBe(3);
    });

    it('문제 제거 시 도메인 이벤트가 발생한다', () => {
      problemSet.clearEvents(); // 기존 이벤트 정리
      problemSet.removeProblem(problemId2);

      const events = problemSet.domainEvents;
      const itemRemovedEvent = events.find(e => e.eventType === 'ProblemSetItemRemoved');
      expect(itemRemovedEvent).toBeDefined();
    });
  });

  describe('문제 순서 변경', () => {
    let problemSet: ProblemSet;

    beforeEach(() => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });
      problemSet = result.value;
      problemSet.addProblem(problemId1);
      problemSet.addProblem(problemId2);
      problemSet.addProblem(problemId3);
    });

    it('문제들의 순서를 변경할 수 있다', () => {
      const newOrder = [problemId3, problemId1, problemId2];
      const result = problemSet.reorderProblems(newOrder);

      expect(result.isSuccess).toBe(true);
      expect(problemSet.getProblemPosition(problemId3)).toBe(0);
      expect(problemSet.getProblemPosition(problemId1)).toBe(1);
      expect(problemSet.getProblemPosition(problemId2)).toBe(2);

      const orderedIds = problemSet.getProblemIds();
      expect(orderedIds).toEqual(newOrder);
    });

    it('문제 개수가 다르면 순서 변경에 실패한다', () => {
      const invalidOrder = [problemId1, problemId2]; // 하나 빠짐
      const result = problemSet.reorderProblems(invalidOrder);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('number of problems must match');
    });

    it('존재하지 않는 문제가 포함되면 순서 변경에 실패한다', () => {
      const invalidId = new UniqueEntityID('invalid');
      const invalidOrder = [problemId1, problemId2, invalidId];
      const result = problemSet.reorderProblems(invalidOrder);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid problem ID');
    });

    it('순서 변경 시 도메인 이벤트가 발생한다', () => {
      problemSet.clearEvents();
      const newOrder = [problemId3, problemId1, problemId2];
      problemSet.reorderProblems(newOrder);

      const events = problemSet.domainEvents;
      const reorderedEvent = events.find(e => e.eventType === 'ProblemSetItemsReordered');
      expect(reorderedEvent).toBeDefined();
    });
  });

  describe('문제집 정보 수정', () => {
    let problemSet: ProblemSet;

    beforeEach(() => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle,
        description: validDescription
      });
      problemSet = result.value;
    });

    it('문제집 제목을 수정할 수 있다', () => {
      const newTitleResult = ProblemSetTitle.create('수학 심화 문제집');
      const newTitle = newTitleResult.value;

      problemSet.updateTitle(newTitle);

      expect(problemSet.title).toBe(newTitle);
      expect(problemSet.title.value).toBe('수학 심화 문제집');
    });

    it('문제집 설명을 수정할 수 있다', () => {
      const newDescResult = ProblemSetDescription.create('중학교 2학년 수학 심화 문제집');
      const newDescription = newDescResult.value;

      problemSet.updateDescription(newDescription);

      expect(problemSet.description).toBe(newDescription);
      expect(problemSet.description?.value).toBe('중학교 2학년 수학 심화 문제집');
    });

    it('문제집 설명을 제거할 수 있다', () => {
      problemSet.clearDescription();

      expect(problemSet.description).toBeUndefined();
    });
  });

  describe('쿼리 메서드', () => {
    let problemSet: ProblemSet;

    beforeEach(() => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });
      problemSet = result.value;
    });

    it('문제집 소유자를 확인할 수 있다', () => {
      expect(problemSet.isOwnedBy(teacherId)).toBe(true);
      expect(problemSet.isOwnedBy('other-teacher')).toBe(false);
    });

    it('문제 추가 가능 여부를 확인할 수 있다', () => {
      expect(problemSet.canAddMoreProblems(50)).toBe(true);
      expect(problemSet.canAddMoreProblems(0)).toBe(false);

      // 문제를 하나 추가하고 테스트
      problemSet.addProblem(problemId1);
      expect(problemSet.canAddMoreProblems(1)).toBe(false);
      expect(problemSet.canAddMoreProblems(2)).toBe(true);
    });

    it('정렬된 문제 목록을 가져올 수 있다', () => {
      problemSet.addProblem(problemId3);
      problemSet.addProblem(problemId1);
      problemSet.addProblem(problemId2);

      const orderedItems = problemSet.getOrderedItems();
      expect(orderedItems).toHaveLength(3);
      expect(orderedItems[0].problemId).toEqual(problemId3);
      expect(orderedItems[1].problemId).toEqual(problemId1);
      expect(orderedItems[2].problemId).toEqual(problemId2);
    });
  });

  describe('도메인 이벤트', () => {
    it('문제집 생성 시 ProblemSetCreated 이벤트가 발생한다', () => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });

      const problemSet = result.value;
      const events = problemSet.domainEvents;
      
      const createdEvent = events.find(e => e.eventType === 'ProblemSetCreated');
      expect(createdEvent).toBeDefined();
      expect(createdEvent?.occurredOn).toBeInstanceOf(Date);
      expect(createdEvent?.eventId).toBeDefined();
    });

    it('이벤트를 정리할 수 있다', () => {
      const result = ProblemSet.create({
        teacherId,
        title: validTitle
      });

      const problemSet = result.value;
      expect(problemSet.domainEvents.length).toBeGreaterThan(0);

      problemSet.clearEvents();
      expect(problemSet.domainEvents).toHaveLength(0);
    });
  });
});