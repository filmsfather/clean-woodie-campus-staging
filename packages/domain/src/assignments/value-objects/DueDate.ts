import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface DueDateProps {
  value: Date;
  timezone?: string;
}

// 마감일 값 객체
// 타임존 정보와 함께 마감일을 관리하며, 마감일 관련 비즈니스 규칙을 캡슐화
export class DueDate extends ValueObject<DueDateProps> {
  private static readonly DEFAULT_TIMEZONE = 'Asia/Seoul';
  private static readonly MIN_ADVANCE_HOURS = 1; // 최소 1시간 이후 마감일
  private static readonly MAX_ADVANCE_DAYS = 365; // 최대 1년 이후 마감일

  get value(): Date {
    return this.props.value;
  }

  get timezone(): string {
    return this.props.timezone || DueDate.DEFAULT_TIMEZONE;
  }

  private constructor(props: DueDateProps) {
    super(props);
  }

  public static create(dueDate: Date, timezone?: string): Result<DueDate> {
    const now = new Date();

    // 과거 날짜 체크
    if (dueDate <= now) {
      return Result.fail<DueDate>('Due date must be in the future');
    }

    // 최소 시간 체크 (1시간 이후)
    const minDueDate = new Date(now.getTime() + (DueDate.MIN_ADVANCE_HOURS * 60 * 60 * 1000));
    if (dueDate < minDueDate) {
      return Result.fail<DueDate>(`Due date must be at least ${DueDate.MIN_ADVANCE_HOURS} hour(s) from now`);
    }

    // 최대 시간 체크 (1년 이내)
    const maxDueDate = new Date(now.getTime() + (DueDate.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000));
    if (dueDate > maxDueDate) {
      return Result.fail<DueDate>(`Due date cannot be more than ${DueDate.MAX_ADVANCE_DAYS} days in the future`);
    }

    // 타임존 유효성 검증
    if (timezone && !DueDate.isValidTimezone(timezone)) {
      return Result.fail<DueDate>('Invalid timezone provided');
    }

    return Result.ok<DueDate>(new DueDate({ 
      value: dueDate, 
      timezone: timezone || DueDate.DEFAULT_TIMEZONE 
    }));
  }

  // 현재 시점에서 생성 (지정된 시간 이후)
  public static createFromNow(hoursFromNow: number, timezone?: string): Result<DueDate> {
    if (hoursFromNow < DueDate.MIN_ADVANCE_HOURS) {
      return Result.fail<DueDate>(`Hours from now must be at least ${DueDate.MIN_ADVANCE_HOURS}`);
    }

    if (hoursFromNow > (DueDate.MAX_ADVANCE_DAYS * 24)) {
      return Result.fail<DueDate>(`Hours from now cannot exceed ${DueDate.MAX_ADVANCE_DAYS * 24}`);
    }

    const dueDate = new Date(Date.now() + (hoursFromNow * 60 * 60 * 1000));
    return DueDate.create(dueDate, timezone);
  }

  // 쿼리 메서드들
  public isOverdue(): boolean {
    return new Date() > this.props.value;
  }

  public isDueSoon(hoursThreshold: number = 24): boolean {
    const now = new Date();
    const thresholdTime = new Date(now.getTime() + (hoursThreshold * 60 * 60 * 1000));
    return this.props.value <= thresholdTime && !this.isOverdue();
  }

  public getTimeUntilDue(): number {
    return Math.max(0, this.props.value.getTime() - Date.now());
  }

  public getHoursUntilDue(): number {
    return Math.max(0, Math.floor(this.getTimeUntilDue() / (60 * 60 * 1000)));
  }

  public getDaysUntilDue(): number {
    return Math.max(0, Math.floor(this.getTimeUntilDue() / (24 * 60 * 60 * 1000)));
  }

  // 마감일 연장
  public extend(additionalHours: number): Result<DueDate> {
    if (additionalHours <= 0) {
      return Result.fail<DueDate>('Additional hours must be positive');
    }

    if (additionalHours > (30 * 24)) { // 최대 30일 연장
      return Result.fail<DueDate>('Cannot extend due date by more than 30 days');
    }

    const newDueDate = new Date(this.props.value.getTime() + (additionalHours * 60 * 60 * 1000));
    return DueDate.create(newDueDate, this.props.timezone);
  }

  // 마감일 변경
  public changeTo(newDueDate: Date): Result<DueDate> {
    return DueDate.create(newDueDate, this.props.timezone);
  }

  // 타임존에 맞춘 로컬 시간 반환
  public toLocalString(): string {
    return this.props.value.toLocaleString('ko-KR', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // 상태 메시지 생성
  public getStatusMessage(): string {
    if (this.isOverdue()) {
      const hoursOverdue = Math.floor((Date.now() - this.props.value.getTime()) / (60 * 60 * 1000));
      return `${hoursOverdue}시간 전 마감됨`;
    }

    const hoursUntil = this.getHoursUntilDue();
    const daysUntil = this.getDaysUntilDue();

    if (daysUntil > 0) {
      return `${daysUntil}일 후 마감`;
    } else if (hoursUntil > 0) {
      return `${hoursUntil}시간 후 마감`;
    } else {
      const minutesUntil = Math.floor(this.getTimeUntilDue() / (60 * 1000));
      return `${minutesUntil}분 후 마감`;
    }
  }

  public equals(other: DueDate): boolean {
    if (!other || !other.props) {
      return false;
    }
    return this.props.value.getTime() === other.props.value.getTime() &&
           this.timezone === other.timezone;
  }

  public toString(): string {
    return this.toLocalString();
  }

  // 타임존 유효성 검증 (기본적인 검증)
  private static isValidTimezone(timezone: string): boolean {
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }

  // 일반적인 마감일 생성 헬퍼들
  public static createEndOfDay(date: Date, timezone?: string): Result<DueDate> {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return DueDate.create(endOfDay, timezone);
  }

  public static createEndOfWeek(timezone?: string): Result<DueDate> {
    const now = new Date();
    const endOfWeek = new Date(now);
    const daysUntilSunday = 7 - now.getDay();
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return DueDate.create(endOfWeek, timezone);
  }

  public static createNextWeek(timezone?: string): Result<DueDate> {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    return DueDate.create(nextWeek, timezone);
  }
}