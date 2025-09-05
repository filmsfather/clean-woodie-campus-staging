// 복제 충돌 해결 전략
export var CloneConflictResolution;
(function (CloneConflictResolution) {
    CloneConflictResolution["SKIP"] = "skip";
    CloneConflictResolution["RENAME"] = "rename";
    CloneConflictResolution["OVERWRITE"] = "overwrite";
    CloneConflictResolution["MERGE"] = "merge"; // 병합 (문제 추가)
})(CloneConflictResolution || (CloneConflictResolution = {}));
//# sourceMappingURL=IProblemSetCloningService.js.map