import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface TagProps {
  name: string;
}

export class Tag extends ValueObject<TagProps> {
  private constructor(props: TagProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  // 주 생성자
  public static create(name: string): Result<Tag> {
    if (!name || typeof name !== 'string') {
      return Result.fail<Tag>('Tag name is required');
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      return Result.fail<Tag>('Tag name cannot be empty');
    }

    if (trimmedName.length > 50) {
      return Result.fail<Tag>('Tag name cannot exceed 50 characters');
    }

    // 태그명 유효성 검증 - 영문, 한글, 숫자, 하이픈, 언더스코어만 허용
    const validTagPattern = /^[a-zA-Z0-9가-힣_-]+$/;
    if (!validTagPattern.test(trimmedName)) {
      return Result.fail<Tag>('Tag name can only contain letters, numbers, hyphens, and underscores');
    }

    return Result.ok<Tag>(new Tag({ name: trimmedName.toLowerCase() })); // 소문자로 정규화
  }

  // 태그 정규화를 위한 유틸리티
  public static normalize(name: string): string {
    return name.trim().toLowerCase();
  }

  // 여러 태그 생성
  public static createMany(names: string[]): Result<Tag[]> {
    const tags: Tag[] = [];
    const errors: string[] = [];

    for (const name of names) {
      const tagResult = this.create(name);
      if (tagResult.isFailure) {
        errors.push(`${name}: ${tagResult.error}`);
      } else {
        tags.push(tagResult.value);
      }
    }

    if (errors.length > 0) {
      return Result.fail<Tag[]>(`Failed to create tags: ${errors.join(', ')}`);
    }

    return Result.ok<Tag[]>(tags);
  }

  // 중복 제거
  public static removeDuplicates(tags: Tag[]): Tag[] {
    const seen = new Set<string>();
    return tags.filter(tag => {
      const name = tag.name;
      if (seen.has(name)) {
        return false;
      }
      seen.add(name);
      return true;
    });
  }

  // 직렬화/역직렬화
  public toJSON(): { type: 'Tag'; name: string } {
    return {
      type: 'Tag',
      name: this.props.name
    };
  }

  public toString(): string {
    return this.props.name;
  }

  public toPrimitive(): string {
    return this.props.name;
  }

  public static fromJSON(json: { name: string }): Result<Tag> {
    return this.create(json.name);
  }

  public static fromString(value: string): Result<Tag> {
    return this.create(value);
  }

  public static fromPrimitive(name: string): Result<Tag> {
    return this.create(name);
  }

  // 배열 직렬화/역직렬화
  public static toStringArray(tags: Tag[]): string[] {
    return tags.map(tag => tag.toPrimitive());
  }

  public static fromStringArray(names: string[]): Result<Tag[]> {
    return this.createMany(names);
  }
}