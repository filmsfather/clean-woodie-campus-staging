export class SystemClock {
    now() {
        return new Date();
    }
}
export class TestClock {
    fixedDate;
    constructor(fixedDate) {
        this.fixedDate = fixedDate;
    }
    now() {
        return new Date(this.fixedDate);
    }
    setDate(date) {
        this.fixedDate = new Date(date);
    }
    advance(milliseconds) {
        this.fixedDate = new Date(this.fixedDate.getTime() + milliseconds);
    }
    advanceDays(days) {
        this.advance(days * 24 * 60 * 60 * 1000);
    }
    advanceHours(hours) {
        this.advance(hours * 60 * 60 * 1000);
    }
    advanceMinutes(minutes) {
        this.advance(minutes * 60 * 1000);
    }
}
//# sourceMappingURL=SystemClock.js.map