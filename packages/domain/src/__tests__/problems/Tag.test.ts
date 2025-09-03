// Tag Value Object 테스트
import { describe, it, expect } from 'vitest';
import { Tag } from '../../problems/value-objects/Tag';

describe('Tag Value Object', () => {
  
  describe('생성 및 유효성 검증', () => {
    it('유효한 태그명으로 생성할 수 있다', () => {
      // When
      const result = Tag.create('수학');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('수학');
    });

    it('영문 태그를 생성할 수 있다', () => {
      // When
      const result = Tag.create('Mathematics');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('mathematics'); // 소문자로 정규화
    });

    it('숫자가 포함된 태그를 생성할 수 있다', () => {
      // When
      const result = Tag.create('Grade9');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('grade9');
    });

    it('하이픈과 언더스코어가 포함된 태그를 생성할 수 있다', () => {
      // When
      const result1 = Tag.create('high-school');
      const result2 = Tag.create('unit_test');

      // Then
      expect(result1.isSuccess).toBe(true);
      expect(result1.value!.name).toBe('high-school');
      expect(result2.isSuccess).toBe(true);
      expect(result2.value!.name).toBe('unit_test');
    });

    it('빈 문자열로는 생성할 수 없다', () => {
      // When
      const result = Tag.create('');

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Tag name is required');
    });

    it('공백만 있는 문자열로는 생성할 수 없다', () => {
      // When
      const result = Tag.create('   ');

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Tag name cannot be empty');
    });

    it('null이나 undefined로는 생성할 수 없다', () => {
      // When
      const result1 = Tag.create(null as any);
      const result2 = Tag.create(undefined as any);

      // Then
      expect(result1.isSuccess).toBe(false);
      expect(result1.error).toContain('Tag name is required');
      expect(result2.isSuccess).toBe(false);
      expect(result2.error).toContain('Tag name is required');
    });

    it('50자를 초과하는 태그명으로는 생성할 수 없다', () => {
      // Given
      const longName = 'a'.repeat(51);

      // When
      const result = Tag.create(longName);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Tag name cannot exceed 50 characters');
    });

    it('특수문자가 포함된 태그명으로는 생성할 수 없다', () => {
      // Given
      const invalidNames = ['태그!', '수학@', '영어#', 'test space', '태그+기호'];

      invalidNames.forEach(name => {
        // When
        const result = Tag.create(name);

        // Then
        expect(result.isSuccess).toBe(false);
        expect(result.error).toContain('Tag name can only contain letters, numbers, hyphens, and underscores');
      });
    });

    it('앞뒤 공백은 자동으로 제거된다', () => {
      // When
      const result = Tag.create('  수학  ');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('수학');
    });

    it('대문자는 소문자로 정규화된다', () => {
      // When
      const result = Tag.create('MATHEMATICS');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('mathematics');
    });
  });

  describe('정규화 유틸리티', () => {
    it('normalize()로 문자열을 정규화할 수 있다', () => {
      // When
      const normalized1 = Tag.normalize('  MATH  ');
      const normalized2 = Tag.normalize('Science');

      // Then
      expect(normalized1).toBe('math');
      expect(normalized2).toBe('science');
    });
  });

  describe('다중 태그 생성', () => {
    it('createMany()로 여러 태그를 한번에 생성할 수 있다', () => {
      // Given
      const names = ['수학', '과학', '영어'];

      // When
      const result = Tag.createMany(names);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!).toHaveLength(3);
      expect(result.value!.map(tag => tag.name)).toEqual(['수학', '과학', '영어']);
    });

    it('createMany()에서 일부 태그가 잘못되면 실패한다', () => {
      // Given
      const names = ['수학', 'invalid!', '과학'];

      // When
      const result = Tag.createMany(names);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Failed to create tags');
      expect(result.error).toContain('invalid!');
    });

    it('빈 배열로 createMany()를 호출하면 빈 배열을 반환한다', () => {
      // When
      const result = Tag.createMany([]);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!).toHaveLength(0);
    });
  });

  describe('중복 제거', () => {
    it('removeDuplicates()로 중복된 태그를 제거할 수 있다', () => {
      // Given
      const tag1 = Tag.create('수학').value!;
      const tag2 = Tag.create('과학').value!;
      const tag3 = Tag.create('수학').value!; // 중복
      const tags = [tag1, tag2, tag3];

      // When
      const uniqueTags = Tag.removeDuplicates(tags);

      // Then
      expect(uniqueTags).toHaveLength(2);
      expect(uniqueTags.map(tag => tag.name)).toEqual(['수학', '과학']);
    });

    it('중복이 없는 경우 원본 배열과 같은 결과를 반환한다', () => {
      // Given
      const tag1 = Tag.create('수학').value!;
      const tag2 = Tag.create('과학').value!;
      const tags = [tag1, tag2];

      // When
      const uniqueTags = Tag.removeDuplicates(tags);

      // Then
      expect(uniqueTags).toHaveLength(2);
      expect(uniqueTags.map(tag => tag.name)).toEqual(['수학', '과학']);
    });
  });

  describe('직렬화/역직렬화', () => {
    it('JSON으로 직렬화할 수 있다', () => {
      // Given
      const tag = Tag.create('수학').value!;

      // When
      const json = tag.toJSON();

      // Then
      expect(json).toEqual({
        type: 'Tag',
        name: '수학'
      });
    });

    it('JSON에서 역직렬화할 수 있다', () => {
      // Given
      const json = { name: '과학' };

      // When
      const result = Tag.fromJSON(json);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('과학');
    });

    it('문자열로 변환할 수 있다', () => {
      // Given
      const tag = Tag.create('영어').value!;

      // When
      const str = tag.toString();

      // Then
      expect(str).toBe('영어');
    });

    it('문자열에서 역직렬화할 수 있다', () => {
      // When
      const result = Tag.fromString('역사');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('역사');
    });

    it('Primitive 형태로 변환할 수 있다', () => {
      // Given
      const tag = Tag.create('음악').value!;

      // When
      const primitive = tag.toPrimitive();

      // Then
      expect(primitive).toBe('음악');
    });

    it('Primitive에서 역직렬화할 수 있다', () => {
      // When
      const result = Tag.fromPrimitive('미술');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('미술');
    });
  });

  describe('배열 직렬화/역직렬화', () => {
    it('toStringArray()로 태그 배열을 문자열 배열로 변환할 수 있다', () => {
      // Given
      const tags = [
        Tag.create('수학').value!,
        Tag.create('과학').value!,
        Tag.create('영어').value!
      ];

      // When
      const stringArray = Tag.toStringArray(tags);

      // Then
      expect(stringArray).toEqual(['수학', '과학', '영어']);
    });

    it('fromStringArray()로 문자열 배열에서 태그 배열을 생성할 수 있다', () => {
      // Given
      const names = ['수학', '과학', '영어'];

      // When
      const result = Tag.fromStringArray(names);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value!).toHaveLength(3);
      expect(result.value!.map(tag => tag.name)).toEqual(['수학', '과학', '영어']);
    });

    it('fromStringArray()에서 잘못된 태그가 있으면 실패한다', () => {
      // Given
      const names = ['수학', 'invalid!', '영어'];

      // When
      const result = Tag.fromStringArray(names);

      // Then
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('동등성 검사', () => {
    it('같은 이름을 가진 Tag는 동등하다', () => {
      // Given
      const tag1 = Tag.create('수학').value!;
      const tag2 = Tag.create('수학').value!;

      // Then
      expect(tag1.equals(tag2)).toBe(true);
    });

    it('대소문자가 다르더라도 정규화되어 동등하다', () => {
      // Given
      const tag1 = Tag.create('MATH').value!;
      const tag2 = Tag.create('math').value!;

      // Then
      expect(tag1.equals(tag2)).toBe(true);
    });

    it('다른 이름을 가진 Tag는 동등하지 않다', () => {
      // Given
      const tag1 = Tag.create('수학').value!;
      const tag2 = Tag.create('과학').value!;

      // Then
      expect(tag1.equals(tag2)).toBe(false);
    });
  });
});