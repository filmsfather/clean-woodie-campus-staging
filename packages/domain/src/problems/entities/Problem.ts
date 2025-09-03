import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { ProblemType } from '../value-objects/ProblemType';
import { ProblemContent } from '../value-objects/ProblemContent';
import { AnswerContent } from '../value-objects/AnswerContent';
import { Difficulty } from '../value-objects/Difficulty';
import { Tag } from '../value-objects/Tag';

// Problem 도메인 엔티티 - 애그리게이트 루트
interface ProblemProps {
  teacherId: string; // UUID string
  content: ProblemContent;
  correctAnswer: AnswerContent;
  difficulty: Difficulty;
  tags: Tag[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Problem extends AggregateRoot<UniqueEntityID> {
  private constructor(private props: ProblemProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID());
  }

  // Getters - 도메인 순수성 유지
  get teacherId(): string {
    return this.props.teacherId;
  }

  get content(): ProblemContent {
    return this.props.content;
  }

  get correctAnswer(): AnswerContent {
    return this.props.correctAnswer;
  }

  get type(): ProblemType {
    return this.props.content.type;
  }

  get difficulty(): Difficulty {
    return this.props.difficulty;
  }

  get tags(): Tag[] {
    return [...this.props.tags]; // 불변성 보장
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // 비즈니스 로직 메서드

  // 문제 내용 업데이트
  public updateContent(newContent: ProblemContent): Result<void> {
    // 문제 유형이 변경되는지 확인
    if (newContent.type.value !== this.props.content.type.value) {
      return Result.fail<void>('Cannot change problem type after creation');
    }

    this.props.content = newContent;
    this.props.updatedAt = new Date();
    
    // TODO: 도메인 이벤트 발행 (ProblemContentUpdated)
    
    return Result.ok<void>();
  }

  // 정답 업데이트
  public updateCorrectAnswer(newAnswer: AnswerContent): Result<void> {
    // 문제 유형과 답안 유형이 일치하는지 확인
    if (newAnswer.type !== this.props.content.type.value) {
      return Result.fail<void>('Answer type must match problem type');
    }

    this.props.correctAnswer = newAnswer;
    this.props.updatedAt = new Date();
    
    // TODO: 도메인 이벤트 발행 (ProblemAnswerUpdated)
    
    return Result.ok<void>();
  }

  // 난이도 변경
  public changeDifficulty(newDifficulty: Difficulty): Result<void> {
    this.props.difficulty = newDifficulty;
    this.props.updatedAt = new Date();
    
    // TODO: 도메인 이벤트 발행 (ProblemDifficultyChanged)
    
    return Result.ok<void>();
  }

  // 태그 관리
  public addTag(tag: Tag): Result<void> {
    // 중복 태그 확인
    const existingTag = this.props.tags.find(t => t.name === tag.name);
    if (existingTag) {
      return Result.fail<void>(`Tag '${tag.name}' already exists`);
    }

    // 태그 수 제한 (예: 10개)
    if (this.props.tags.length >= 10) {
      return Result.fail<void>('Cannot have more than 10 tags per problem');
    }

    this.props.tags = [...this.props.tags, tag];
    this.props.updatedAt = new Date();
    
    return Result.ok<void>();
  }

  public removeTag(tagName: string): Result<void> {
    const tagIndex = this.props.tags.findIndex(t => t.name === tagName);
    if (tagIndex === -1) {
      return Result.fail<void>(`Tag '${tagName}' not found`);
    }

    this.props.tags = this.props.tags.filter(t => t.name !== tagName);
    this.props.updatedAt = new Date();
    
    return Result.ok<void>();
  }

  public updateTags(newTags: Tag[]): Result<void> {
    // 태그 수 제한
    if (newTags.length > 10) {
      return Result.fail<void>('Cannot have more than 10 tags per problem');
    }

    // 중복 태그 제거
    const uniqueTags = Tag.removeDuplicates(newTags);
    
    this.props.tags = uniqueTags;
    this.props.updatedAt = new Date();
    
    return Result.ok<void>();
  }

  // 문제 활성화/비활성화
  public activate(): Result<void> {
    if (this.props.isActive) {
      return Result.fail<void>('Problem is already active');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();
    
    // TODO: 도메인 이벤트 발행 (ProblemActivated)
    
    return Result.ok<void>();
  }

  public deactivate(): Result<void> {
    if (!this.props.isActive) {
      return Result.fail<void>('Problem is already inactive');
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();
    
    // TODO: 도메인 이벤트 발행 (ProblemDeactivated)
    
    return Result.ok<void>();
  }

  // 문제 소유권 확인
  public isOwnedBy(teacherId: string): boolean {
    return this.props.teacherId === teacherId;
  }

  // 문제 복제 (새로운 문제 생성)
  public clone(newTeacherId?: string): Result<Problem> {
    const clonedProblem = Problem.create({
      teacherId: newTeacherId || this.props.teacherId,
      content: this.props.content,
      correctAnswer: this.props.correctAnswer,
      difficulty: this.props.difficulty,
      tags: this.props.tags
    });

    if (clonedProblem.isFailure) {
      return Result.fail<Problem>(`Failed to clone problem: ${clonedProblem.error}`);
    }

    return Result.ok<Problem>(clonedProblem.value);
  }

  // 문제 유효성 검증 (사용 전 체크)
  public validateForUse(): Result<void> {
    if (!this.props.isActive) {
      return Result.fail<void>('Problem is not active');
    }

    // 내용과 정답 타입 일치 확인
    if (this.props.content.type.value !== this.props.correctAnswer.type) {
      return Result.fail<void>('Problem content and answer type mismatch');
    }

    return Result.ok<void>();
  }

  // 검색 메타데이터 생성
  public getSearchMetadata(): {
    id: string;
    teacherId: string;
    type: string;
    difficulty: number;
    tags: string[];
    title: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
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
  public static create(props: {
    teacherId: string;
    content: ProblemContent;
    correctAnswer: AnswerContent;
    difficulty: Difficulty;
    tags?: Tag[];
  }, id?: UniqueEntityID): Result<Problem> {

    // 필수 필드 검증
    if (!props.teacherId || props.teacherId.trim().length === 0) {
      return Result.fail<Problem>('Teacher ID is required');
    }

    // 문제 유형과 답안 유형 일치 확인
    if (props.content.type.value !== props.correctAnswer.type) {
      return Result.fail<Problem>('Problem content and answer type must match');
    }

    // 태그 검증 및 중복 제거
    const tags = props.tags || [];
    if (tags.length > 10) {
      return Result.fail<Problem>('Cannot have more than 10 tags per problem');
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

    return Result.ok<Problem>(problem);
  }

  // 데이터베이스에서 복원 (팩토리 메서드)
  public static restore(props: {
    id: string;
    teacherId: string;
    content: ProblemContent;
    correctAnswer: AnswerContent;
    difficulty: Difficulty;
    tags: Tag[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Result<Problem> {

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

    return Result.ok<Problem>(problem);
  }

  // 직렬화 (영속성을 위한)
  public toPersistence(): {
    id: string;
    teacherId: string;
    content: any;
    correctAnswer: any;
    difficulty: number;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
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