import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { Tag } from '../value-objects/Tag';
export class Problem extends AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    // Getters - 도메인 순수성 유지
    get teacherId() {
        return this.props.teacherId;
    }
    get content() {
        return this.props.content;
    }
    get correctAnswer() {
        return this.props.correctAnswer;
    }
    get type() {
        return this.props.content.type;
    }
    get difficulty() {
        return this.props.difficulty;
    }
    get tags() {
        return [...this.props.tags]; // 불변성 보장
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    // 비즈니스 로직 메서드
    // 문제 내용 업데이트
    updateContent(newContent) {
        // 문제 유형이 변경되는지 확인
        if (newContent.type.value !== this.props.content.type.value) {
            return Result.fail('Cannot change problem type after creation');
        }
        this.props.content = newContent;
        this.props.updatedAt = new Date();
        // TODO: 도메인 이벤트 발행 (ProblemContentUpdated)
        return Result.ok();
    }
    // 정답 업데이트
    updateCorrectAnswer(newAnswer) {
        // 문제 유형과 답안 유형이 일치하는지 확인
        if (newAnswer.type !== this.props.content.type.value) {
            return Result.fail('Answer type must match problem type');
        }
        this.props.correctAnswer = newAnswer;
        this.props.updatedAt = new Date();
        // TODO: 도메인 이벤트 발행 (ProblemAnswerUpdated)
        return Result.ok();
    }
    // 난이도 변경
    changeDifficulty(newDifficulty) {
        this.props.difficulty = newDifficulty;
        this.props.updatedAt = new Date();
        // TODO: 도메인 이벤트 발행 (ProblemDifficultyChanged)
        return Result.ok();
    }
    // 태그 관리
    addTag(tag) {
        // 중복 태그 확인
        const existingTag = this.props.tags.find(t => t.name === tag.name);
        if (existingTag) {
            return Result.fail(`Tag '${tag.name}' already exists`);
        }
        // 태그 수 제한 (예: 10개)
        if (this.props.tags.length >= 10) {
            return Result.fail('Cannot have more than 10 tags per problem');
        }
        this.props.tags = [...this.props.tags, tag];
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    removeTag(tagName) {
        const tagIndex = this.props.tags.findIndex(t => t.name === tagName);
        if (tagIndex === -1) {
            return Result.fail(`Tag '${tagName}' not found`);
        }
        this.props.tags = this.props.tags.filter(t => t.name !== tagName);
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    updateTags(newTags) {
        // 태그 수 제한
        if (newTags.length > 10) {
            return Result.fail('Cannot have more than 10 tags per problem');
        }
        // 중복 태그 제거
        const uniqueTags = Tag.removeDuplicates(newTags);
        this.props.tags = uniqueTags;
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    // 문제 활성화/비활성화
    activate() {
        if (this.props.isActive) {
            return Result.fail('Problem is already active');
        }
        this.props.isActive = true;
        this.props.updatedAt = new Date();
        // TODO: 도메인 이벤트 발행 (ProblemActivated)
        return Result.ok();
    }
    deactivate() {
        if (!this.props.isActive) {
            return Result.fail('Problem is already inactive');
        }
        this.props.isActive = false;
        this.props.updatedAt = new Date();
        // TODO: 도메인 이벤트 발행 (ProblemDeactivated)
        return Result.ok();
    }
    // 문제 소유권 확인
    isOwnedBy(teacherId) {
        return this.props.teacherId === teacherId;
    }
    // 문제 복제 (새로운 문제 생성)
    clone(newTeacherId) {
        const clonedProblem = Problem.create({
            teacherId: newTeacherId || this.props.teacherId,
            content: this.props.content,
            correctAnswer: this.props.correctAnswer,
            difficulty: this.props.difficulty,
            tags: this.props.tags
        });
        if (clonedProblem.isFailure) {
            return Result.fail(`Failed to clone problem: ${clonedProblem.error}`);
        }
        return Result.ok(clonedProblem.value);
    }
    // 문제 유효성 검증 (사용 전 체크)
    validateForUse() {
        if (!this.props.isActive) {
            return Result.fail('Problem is not active');
        }
        // 내용과 정답 타입 일치 확인
        if (this.props.content.type.value !== this.props.correctAnswer.type) {
            return Result.fail('Problem content and answer type mismatch');
        }
        return Result.ok();
    }
    // 검색 메타데이터 생성
    getSearchMetadata() {
        return {
            id: this.id.toString(),
            teacherId: this.props.teacherId,
            type: this.props.content.type.value,
            difficulty: this.props.difficulty.level,
            tags: this.props.tags.map(tag => tag.name),
            title: this.props.content.title,
            isActive: this.props.isActive,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }
    // 팩토리 메서드
    static create(props, id) {
        // 필수 필드 검증
        if (!props.teacherId || props.teacherId.trim().length === 0) {
            return Result.fail('Teacher ID is required');
        }
        // 문제 유형과 답안 유형 일치 확인
        if (props.content.type.value !== props.correctAnswer.type) {
            return Result.fail('Problem content and answer type must match');
        }
        // 태그 검증 및 중복 제거
        const tags = props.tags || [];
        if (tags.length > 10) {
            return Result.fail('Cannot have more than 10 tags per problem');
        }
        const uniqueTags = Tag.removeDuplicates(tags);
        const now = new Date();
        const problem = new Problem({
            teacherId: props.teacherId.trim(),
            content: props.content,
            correctAnswer: props.correctAnswer,
            difficulty: props.difficulty,
            tags: uniqueTags,
            isActive: true, // 기본적으로 활성화
            createdAt: now,
            updatedAt: now
        }, id);
        // TODO: 도메인 이벤트 발행 (ProblemCreated)
        return Result.ok(problem);
    }
    // 데이터베이스에서 복원 (팩토리 메서드)
    static restore(props) {
        const problem = new Problem({
            teacherId: props.teacherId,
            content: props.content,
            correctAnswer: props.correctAnswer,
            difficulty: props.difficulty,
            tags: props.tags,
            isActive: props.isActive,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt
        }, new UniqueEntityID(props.id));
        return Result.ok(problem);
    }
    // 직렬화 (영속성을 위한)
    toPersistence() {
        return {
            id: this.id.toString(),
            teacherId: this.props.teacherId,
            content: this.props.content.toPrimitive(),
            correctAnswer: this.props.correctAnswer.toPrimitive(),
            difficulty: this.props.difficulty.level,
            tags: this.props.tags.map(tag => tag.name),
            isActive: this.props.isActive,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }
}
//# sourceMappingURL=Problem.js.map