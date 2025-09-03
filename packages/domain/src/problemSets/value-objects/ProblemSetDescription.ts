import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';

interface ProblemSetDescriptionProps {
  value: string;
}

export class ProblemSetDescription extends ValueObject<ProblemSetDescriptionProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: ProblemSetDescriptionProps) {
    super(props);
  }

  public static create(description: string): Result<ProblemSetDescription> {
    const guardResult = Guard.againstNullOrUndefined(description, 'description');
    if (guardResult.isFailure) {
      return Result.fail<ProblemSetDescription>(guardResult.error);
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > 1000) {
      return Result.fail<ProblemSetDescription>('Problem set description cannot exceed 1000 characters');
    }

    return Result.ok<ProblemSetDescription>(new ProblemSetDescription({ value: trimmedDescription }));
  }

  public static createEmpty(): ProblemSetDescription {
    return new ProblemSetDescription({ value: '' });
  }
}