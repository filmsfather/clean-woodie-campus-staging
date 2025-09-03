import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';

interface ProblemSetTitleProps {
  value: string;
}

export class ProblemSetTitle extends ValueObject<ProblemSetTitleProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: ProblemSetTitleProps) {
    super(props);
  }

  public static create(title: string): Result<ProblemSetTitle> {
    const guardResult = Guard.againstNullOrUndefined(title, 'title');
    if (guardResult.isFailure) {
      return Result.fail<ProblemSetTitle>(guardResult.error);
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length === 0) {
      return Result.fail<ProblemSetTitle>('Problem set title cannot be empty');
    }

    if (trimmedTitle.length > 200) {
      return Result.fail<ProblemSetTitle>('Problem set title cannot exceed 200 characters');
    }

    return Result.ok<ProblemSetTitle>(new ProblemSetTitle({ value: trimmedTitle }));
  }
}