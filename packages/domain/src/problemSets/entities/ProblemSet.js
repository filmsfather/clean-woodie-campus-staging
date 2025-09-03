import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { ProblemSetItem } from './ProblemSetItem';
import { ProblemSetCreatedEvent } from '../events/ProblemSetCreatedEvent';
import { ProblemSetItemCreatedEvent } from '../events/ProblemSetItemCreatedEvent';
import { ProblemSetItemRemovedEvent } from '../events/ProblemSetItemRemovedEvent';
import { ProblemSetItemsReorderedEvent } from '../events/ProblemSetItemsReorderedEvent';
// 문제집 애그리게이트 루트
// 교사가 만든 문제들의 집합을 관리하며, 문제 추가/제거/순서 변경 등의 비즈니스 로직을 담당
export class ProblemSet extends AggregateRoot {
    _teacherId;
    _title;
    _description;
    _items;
    _createdAt;
    _updatedAt;
    constructor(props, id) {
        super(id || new UniqueEntityID());
        this._teacherId = props.teacherId;
        this._title = props.title;
        this._description = props.description;
        this._items = props.items || [];
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }
    // Getter 메서드들 - 내부 상태에 대한 읽기 전용 접근
    get teacherId() {
        return this._teacherId;
    }
    get title() {
        return this._title;
    }
    get description() {
        return this._description;
    }
    get items() {
        return [...this._items];
    }
    get itemCount() {
        return this._items.length;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // 비즈니스 로직 메서드들 - 문제집의 핵심 도메인 행위
    // 문제집에 새로운 문제를 추가
    addProblem(problemId, orderIndex) {
        // 중복 체크
        if (this._items.some(item => item.problemId.equals(problemId))) {
            return Result.fail('Problem already exists in this problem set');
        }
        // 순서 인덱스 결정
        const index = orderIndex !== undefined ? orderIndex : this._items.length;
        // 유효한 인덱스 범위 체크
        if (index < 0 || index > this._items.length) {
            return Result.fail('Invalid order index');
        }
        // 기존 항목들의 순서 조정
        this._items.forEach(item => {
            if (item.orderIndex >= index) {
                item.updateOrderIndex(item.orderIndex + 1);
            }
        });
        // 새 항목 생성 및 추가
        const newItemResult = ProblemSetItem.create({
            problemSetId: this.id,
            problemId,
            orderIndex: index
        });
        if (newItemResult.isFailure) {
            return Result.fail(newItemResult.error);
        }
        const newItem = newItemResult.value;
        this._items.push(newItem);
        this._items.sort((a, b) => a.orderIndex - b.orderIndex);
        this._updatedAt = new Date();
        // 도메인 이벤트 추가
        this.addDomainEvent(new ProblemSetItemCreatedEvent(this.id, newItem.problemId, index));
        return Result.ok();
    }
    // 문제집에서 문제를 제거
    removeProblem(problemId) {
        const itemIndex = this._items.findIndex(item => item.problemId.equals(problemId));
        if (itemIndex === -1) {
            return Result.fail('Problem not found in this problem set');
        }
        const removedItem = this._items[itemIndex];
        const removedOrderIndex = removedItem.orderIndex;
        // 항목 제거
        this._items.splice(itemIndex, 1);
        // 나머지 항목들의 순서 조정
        this._items.forEach(item => {
            if (item.orderIndex > removedOrderIndex) {
                item.updateOrderIndex(item.orderIndex - 1);
            }
        });
        this._updatedAt = new Date();
        // 도메인 이벤트 추가
        this.addDomainEvent(new ProblemSetItemRemovedEvent(this.id, problemId, removedOrderIndex));
        return Result.ok();
    }
    // 문제집 내 문제들의 순서를 재정렬
    reorderProblems(orderedProblemIds) {
        // 개수 일치 확인
        if (orderedProblemIds.length !== this._items.length) {
            return Result.fail('The number of problems must match the current items');
        }
        // 모든 문제 ID가 현재 문제집에 존재하는지 확인
        const currentProblemIds = this._items.map(item => item.problemId);
        for (const problemId of orderedProblemIds) {
            if (!currentProblemIds.some(id => id.equals(problemId))) {
                return Result.fail('Invalid problem ID in reorder list');
            }
        }
        // 새로운 순서로 정렬
        const reorderedItems = [];
        orderedProblemIds.forEach((problemId, newIndex) => {
            const item = this._items.find(item => item.problemId.equals(problemId));
            if (item) {
                item.updateOrderIndex(newIndex);
                reorderedItems.push(item);
            }
        });
        this._items = reorderedItems;
        this._updatedAt = new Date();
        // 도메인 이벤트 추가
        this.addDomainEvent(new ProblemSetItemsReorderedEvent(this.id, orderedProblemIds));
        return Result.ok();
    }
    // 문제집 제목 수정
    updateTitle(title) {
        this._title = title;
        this._updatedAt = new Date();
    }
    // 문제집 설명 수정
    updateDescription(description) {
        this._description = description;
        this._updatedAt = new Date();
    }
    // 문제집 설명 제거
    clearDescription() {
        this._description = undefined;
        this._updatedAt = new Date();
    }
    // 쿼리 메서드들 - 상태 조회 및 검증
    isEmpty() {
        return this._items.length === 0;
    }
    containsProblem(problemId) {
        return this._items.some(item => item.problemId.equals(problemId));
    }
    getProblemPosition(problemId) {
        const item = this._items.find(item => item.problemId.equals(problemId));
        return item ? item.orderIndex : -1;
    }
    getProblemIds() {
        return this._items
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map(item => item.problemId);
    }
    getOrderedItems() {
        return [...this._items].sort((a, b) => a.orderIndex - b.orderIndex);
    }
    isOwnedBy(teacherId) {
        return this._teacherId === teacherId;
    }
    canAddMoreProblems(maxProblemsPerSet = 50) {
        return this._items.length < maxProblemsPerSet;
    }
    // 팩토리 메서드들 - 안전한 인스턴스 생성
    // 빈 문제집 생성 (문제 없이)
    static create(props, id) {
        // 교사 ID 검증
        if (!props.teacherId || props.teacherId.trim().length === 0) {
            return Result.fail('Teacher ID is required');
        }
        // 제목 검증 (이미 ProblemSetTitle에서 검증됨)
        if (props.title.value.length === 0) {
            return Result.fail('Problem set title cannot be empty');
        }
        const problemSet = new ProblemSet(props, id);
        // 문제집 생성 이벤트 발생
        problemSet.addDomainEvent(new ProblemSetCreatedEvent(problemSet.id, new UniqueEntityID(props.teacherId), props.title.value));
        return Result.ok(problemSet);
    }
    // 문제들과 함께 문제집 생성
    static createWithItems(props, id) {
        const baseResult = ProblemSet.create(props, id);
        if (baseResult.isFailure) {
            return baseResult;
        }
        const problemSet = baseResult.value;
        // 아이템들 추가
        if (props.items && props.items.length > 0) {
            // 순서 검증
            const sortedItems = props.items.sort((a, b) => a.orderIndex - b.orderIndex);
            let expectedIndex = 0;
            for (const item of sortedItems) {
                if (item.orderIndex !== expectedIndex) {
                    return Result.fail('Invalid item order indices');
                }
                expectedIndex++;
            }
            problemSet._items = props.items;
        }
        return Result.ok(problemSet);
    }
}
//# sourceMappingURL=ProblemSet.js.map