import { Problem } from '@woodie/domain/problems/entities/Problem';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ProblemContent } from '@woodie/domain/problems/value-objects/ProblemContent';
import { AnswerContent } from '@woodie/domain/problems/value-objects/AnswerContent';
import { Difficulty } from '@woodie/domain/problems/value-objects/Difficulty';
import { Tag } from '@woodie/domain/problems/value-objects/Tag';
import { randomUUID } from 'crypto';
import * as xlsx from 'xlsx';
export class ProblemBankExportService {
    supabase;
    problemRepository;
    fileService;
    cache;
    logger;
    exportJobs = new Map();
    importJobs = new Map();
    constructor(supabase, problemRepository, fileService, logger, cache) {
        this.supabase = supabase;
        this.problemRepository = problemRepository;
        this.fileService = fileService;
        this.logger = logger;
        this.cache = cache;
    }
    async exportProblemBank(teacherId, filter, options = { format: 'json' }) {
        const exportId = randomUUID();
        const correlationId = randomUUID();
        try {
            this.logger.info('Starting problem bank export', {
                teacherId,
                exportId,
                filter,
                options,
                correlationId
            });
            // Export job 생성
            const exportJob = {
                id: exportId,
                teacherId,
                status: 'pending',
                progress: 0,
                totalItems: 0,
                processedItems: 0,
                startedAt: new Date()
            };
            this.exportJobs.set(exportId, exportJob);
            // 비동기로 실제 내보내기 작업 실행
            this.performExport(exportId, teacherId, filter, options, correlationId)
                .catch(error => {
                this.logger.error('Export job failed', {
                    exportId,
                    error: error.message,
                    correlationId
                });
                const job = this.exportJobs.get(exportId);
                if (job) {
                    job.status = 'failed';
                    job.error = error.message;
                    job.completedAt = new Date();
                }
            });
            // 즉시 응답 (비동기 작업 ID와 함께)
            return Result.ok({
                fileId: '', // 아직 파일이 생성되지 않음
                fileName: '',
                fileSize: 0,
                downloadUrl: '',
                exportedCount: 0,
                format: options.format,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
                metadata: {
                    exportedAt: new Date(),
                    exportedBy: teacherId,
                    filter,
                    options
                }
            });
        }
        catch (error) {
            this.logger.error('Export initiation failed', {
                teacherId,
                error: error instanceof Error ? error.message : String(error),
                correlationId
            });
            return Result.fail(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async importProblemBank(teacherId, fileId, options = {}) {
        const importId = randomUUID();
        const correlationId = randomUUID();
        try {
            this.logger.info('Starting problem bank import', {
                teacherId,
                fileId,
                importId,
                options,
                correlationId
            });
            // 파일 검증
            const validationResult = await this.validateImportFile(fileId);
            if (validationResult.isFailure) {
                return Result.fail(`Import validation failed: ${validationResult.error}`);
            }
            const validation = validationResult.value;
            if (!validation.isValid) {
                return Result.fail(`Import file validation failed: ${validation.errors.length} errors found`);
            }
            // 검증만 수행하는 경우
            if (options.validateOnly) {
                return Result.ok({
                    success: true,
                    importedCount: 0,
                    skippedCount: 0,
                    errorCount: validation.errors.length,
                    totalCount: validation.totalRows,
                    importedIds: [],
                    skippedIds: [],
                    errors: validation.errors,
                    warnings: validation.warnings
                });
            }
            // 실제 가져오기 수행
            return await this.performImport(teacherId, fileId, options, correlationId);
        }
        catch (error) {
            this.logger.error('Import failed', {
                teacherId,
                fileId,
                error: error instanceof Error ? error.message : String(error),
                correlationId
            });
            return Result.fail(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateImportFile(fileId, format) {
        try {
            // 파일 메타데이터 조회
            const metadataResult = await this.fileService.getFileMetadata(fileId);
            if (metadataResult.isFailure) {
                return Result.fail(`Failed to get file metadata: ${metadataResult.error}`);
            }
            const metadata = metadataResult.value;
            const fileFormat = format || this.detectFormat(metadata.mimeType);
            // 파일 내용 읽기
            let data;
            switch (fileFormat) {
                case 'json':
                    const jsonResult = await this.fileService.readJsonFile(fileId);
                    if (jsonResult.isFailure) {
                        return Result.fail(`Failed to read JSON file: ${jsonResult.error}`);
                    }
                    data = jsonResult.value;
                    break;
                case 'csv':
                    const csvResult = await this.parseCsvFile(fileId);
                    if (csvResult.isFailure) {
                        return Result.fail(`Failed to parse CSV file: ${csvResult.error}`);
                    }
                    data = csvResult.value;
                    break;
                case 'xlsx':
                    const xlsxResult = await this.parseXlsxFile(fileId);
                    if (xlsxResult.isFailure) {
                        return Result.fail(`Failed to parse XLSX file: ${xlsxResult.error}`);
                    }
                    data = xlsxResult.value;
                    break;
                default:
                    return Result.fail(`Unsupported file format: ${fileFormat}`);
            }
            // 데이터 검증
            const validationResult = this.validateImportData(data);
            return Result.ok({
                isValid: validationResult.errors.length === 0,
                totalRows: data.length,
                validRows: data.length - validationResult.errors.length,
                invalidRows: validationResult.errors.length,
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                preview: data.slice(0, 5) // 처음 5개 행 미리보기
            });
        }
        catch (error) {
            return Result.fail(`File validation error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generateExportTemplate(format, includeExamples = true) {
        try {
            const templateData = [];
            if (includeExamples) {
                templateData.push({
                    title: "예제 객관식 문제",
                    description: "다음 중 올바른 답을 선택하세요.",
                    type: "multiple_choice",
                    difficulty: 3,
                    tags: ["수학", "기초"],
                    correctAnswer: {
                        type: "multiple_choice",
                        acceptedAnswers: ["A"],
                        points: 1
                    },
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }, {
                    title: "예제 단답형 문제",
                    description: "빈 칸에 알맞은 답을 입력하세요.",
                    type: "short_answer",
                    difficulty: 2,
                    tags: ["국어", "기초"],
                    correctAnswer: {
                        type: "short_answer",
                        acceptedAnswers: ["정답"],
                        points: 1
                    },
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            // 파일 생성
            let fileName;
            let fileBuffer;
            switch (format) {
                case 'json':
                    fileName = `problem_bank_template_${Date.now()}.json`;
                    fileBuffer = Buffer.from(JSON.stringify(templateData, null, 2));
                    break;
                case 'csv':
                    fileName = `problem_bank_template_${Date.now()}.csv`;
                    fileBuffer = this.generateCsvBuffer(templateData);
                    break;
                case 'xlsx':
                    fileName = `problem_bank_template_${Date.now()}.xlsx`;
                    fileBuffer = this.generateXlsxBuffer(templateData);
                    break;
            }
            // 파일 업로드
            const uploadResult = await this.fileService.uploadFile(fileBuffer, fileName, { generateUniqueFileName: false });
            if (uploadResult.isFailure) {
                return Result.fail(`Failed to upload template file: ${uploadResult.error}`);
            }
            const fileMetadata = uploadResult.value;
            const downloadUrl = await this.fileService.getDownloadUrl(fileMetadata.id);
            return Result.ok({
                fileId: fileMetadata.id,
                fileName: fileMetadata.fileName,
                fileSize: fileMetadata.size,
                downloadUrl: downloadUrl.isSuccess ? downloadUrl.value : '',
                exportedCount: templateData.length,
                format,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                metadata: {
                    exportedAt: new Date(),
                    exportedBy: 'system',
                    options: { format }
                }
            });
        }
        catch (error) {
            return Result.fail(`Template generation error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getExportStatus(exportId) {
        const job = this.exportJobs.get(exportId);
        if (!job) {
            return Result.fail(`Export job not found: ${exportId}`);
        }
        const estimatedTimeRemaining = this.calculateEstimatedTime(job);
        return Result.ok({
            status: job.status,
            progress: job.progress,
            estimatedTimeRemaining,
            error: job.error
        });
    }
    async getImportStatus(importId) {
        const job = this.importJobs.get(importId);
        if (!job) {
            return Result.fail(`Import job not found: ${importId}`);
        }
        return Result.ok({
            status: job.status,
            progress: job.progress,
            processedRows: job.processedRows,
            totalRows: job.totalRows,
            estimatedTimeRemaining: this.calculateEstimatedTime(job),
            error: job.error
        });
    }
    async getExportHistory(teacherId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('export_history')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                return Result.fail(`Failed to get export history: ${error.message}`);
            }
            const history = (data || []).map(this.mapToExportResult);
            return Result.ok(history);
        }
        catch (error) {
            return Result.fail(`Export history error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getImportHistory(teacherId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('import_history')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                return Result.fail(`Failed to get import history: ${error.message}`);
            }
            const history = (data || []).map(this.mapToImportResult);
            return Result.ok(history);
        }
        catch (error) {
            return Result.fail(`Import history error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async performExport(exportId, teacherId, filter, options = { format: 'json' }, correlationId) {
        const job = this.exportJobs.get(exportId);
        job.status = 'processing';
        try {
            // 문제 조회
            const problemsResult = await this.problemRepository.findByTeacherId(teacherId, {
                includeInactive: options.includeInactiveProblems,
                tagFilter: filter?.tagNames,
                difficultyRange: filter?.difficultyLevels ? {
                    min: Math.min(...filter.difficultyLevels),
                    max: Math.max(...filter.difficultyLevels)
                } : undefined
            });
            if (problemsResult.isFailure) {
                throw new Error(`Failed to fetch problems: ${problemsResult.error}`);
            }
            const problems = problemsResult.value;
            job.totalItems = problems.length;
            // 데이터 변환
            const exportData = [];
            for (let i = 0; i < problems.length; i++) {
                const problem = problems[i];
                const problemData = {
                    id: options.preserveIds ? problem.id.toString() : undefined,
                    title: problem.content.title,
                    description: problem.content.description,
                    type: problem.type.value,
                    difficulty: problem.difficulty.level,
                    tags: problem.tags.map(tag => tag.name),
                    correctAnswer: options.includeAnswers ? problem.correctAnswer.toPrimitive() : undefined,
                    isActive: problem.isActive,
                    createdAt: problem.createdAt.toISOString(),
                    updatedAt: problem.updatedAt.toISOString()
                };
                if (options.includeStatistics) {
                    // 문제별 통계 정보 추가
                    problemData.statistics = {};
                }
                exportData.push(problemData);
                job.processedItems = i + 1;
                job.progress = Math.round((job.processedItems / job.totalItems) * 100);
            }
            // 파일 생성 및 업로드
            const fileName = `problem_bank_export_${teacherId}_${Date.now()}.${options.format}`;
            let fileBuffer;
            switch (options.format) {
                case 'json':
                    fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2));
                    break;
                case 'csv':
                    fileBuffer = this.generateCsvBuffer(exportData);
                    break;
                case 'xlsx':
                    fileBuffer = this.generateXlsxBuffer(exportData);
                    break;
                default:
                    throw new Error(`Unsupported format: ${options.format}`);
            }
            const uploadResult = await this.fileService.uploadFile(fileBuffer, fileName);
            if (uploadResult.isFailure) {
                throw new Error(`File upload failed: ${uploadResult.error}`);
            }
            job.resultFileId = uploadResult.value.id;
            job.status = 'completed';
            job.completedAt = new Date();
            job.progress = 100;
            this.logger.info('Export completed successfully', {
                exportId,
                teacherId,
                exportedCount: exportData.length,
                correlationId
            });
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : String(error);
            job.completedAt = new Date();
            throw error;
        }
    }
    async performImport(teacherId, fileId, options, correlationId) {
        const result = {
            success: false,
            importedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            totalCount: 0,
            importedIds: [],
            skippedIds: [],
            errors: [],
            warnings: []
        };
        try {
            // 파일 데이터 읽기
            const jsonResult = await this.fileService.readJsonFile(fileId);
            if (jsonResult.isFailure) {
                return Result.fail(`Failed to read import file: ${jsonResult.error}`);
            }
            const importData = jsonResult.value;
            result.totalCount = importData.length;
            const batchSize = options.batchSize || 10;
            for (let i = 0; i < importData.length; i += batchSize) {
                const batch = importData.slice(i, i + batchSize);
                for (const [index, data] of batch.entries()) {
                    const actualIndex = i + index;
                    try {
                        const importResult = await this.importSingleProblem(teacherId, data, options);
                        if (importResult.isSuccess) {
                            result.importedCount++;
                            result.importedIds.push(importResult.value.id.toString());
                        }
                        else {
                            result.skippedCount++;
                            result.skippedIds.push(data.id || `row_${actualIndex}`);
                            result.errors.push({
                                row: actualIndex + 1,
                                message: importResult.error || 'Unknown error',
                                data
                            });
                        }
                    }
                    catch (error) {
                        result.errorCount++;
                        result.errors.push({
                            row: actualIndex + 1,
                            message: error instanceof Error ? error.message : String(error),
                            data
                        });
                    }
                }
            }
            result.success = result.errorCount === 0;
            this.logger.info('Import completed', {
                teacherId,
                fileId,
                imported: result.importedCount,
                skipped: result.skippedCount,
                errors: result.errorCount,
                correlationId
            });
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Import process failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async importSingleProblem(teacherId, data, options) {
        try {
            // 중복 확인
            if (data.id && !options.overwriteExisting) {
                const existsResult = await this.problemRepository.exists(new UniqueEntityID(data.id));
                if (existsResult.isSuccess && existsResult.value) {
                    if (options.skipDuplicates) {
                        return Result.fail('Problem already exists (skipped)');
                    }
                    else {
                        return Result.fail('Problem already exists');
                    }
                }
            }
            // Value Objects 생성
            const contentResult = ProblemContent.create({
                title: data.title,
                description: data.description,
                type: data.type
            });
            if (contentResult.isFailure) {
                return Result.fail(`Invalid content: ${contentResult.error}`);
            }
            const answerResult = AnswerContent.fromPrimitive(data.correctAnswer);
            if (answerResult.isFailure) {
                return Result.fail(`Invalid answer: ${answerResult.error}`);
            }
            const difficultyResult = Difficulty.create(data.difficulty);
            if (difficultyResult.isFailure) {
                return Result.fail(`Invalid difficulty: ${difficultyResult.error}`);
            }
            const tags = data.tags.map(tagName => {
                const tagResult = Tag.create(tagName);
                return tagResult.isSuccess ? tagResult.value : null;
            }).filter(Boolean);
            // Problem 생성
            const problemData = {
                teacherId,
                content: contentResult.value,
                correctAnswer: answerResult.value,
                difficulty: difficultyResult.value,
                tags
            };
            let problem;
            if (data.id && options.preserveIds) {
                const restoreResult = Problem.restore({
                    id: data.id,
                    ...problemData,
                    isActive: options.markAsActive ?? data.isActive,
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt)
                });
                if (restoreResult.isFailure) {
                    return Result.fail(`Failed to restore problem: ${restoreResult.error}`);
                }
                problem = restoreResult.value;
            }
            else {
                const createResult = Problem.create(problemData);
                if (createResult.isFailure) {
                    return Result.fail(`Failed to create problem: ${createResult.error}`);
                }
                problem = createResult.value;
                if (options.markAsActive !== undefined) {
                    if (options.markAsActive) {
                        problem.activate();
                    }
                    else {
                        problem.deactivate();
                    }
                }
            }
            // 저장
            const saveResult = await this.problemRepository.save(problem);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save problem: ${saveResult.error}`);
            }
            return Result.ok(problem);
        }
        catch (error) {
            return Result.fail(`Import error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // 헬퍼 메서드들
    detectFormat(mimeType) {
        switch (mimeType) {
            case 'application/json': return 'json';
            case 'text/csv': return 'csv';
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'xlsx';
            default: return 'json';
        }
    }
    async parseCsvFile(fileId) {
        // CSV 파싱 로직 구현
        return Result.fail('CSV parsing not implemented');
    }
    async parseXlsxFile(fileId) {
        // XLSX 파싱 로직 구현
        return Result.fail('XLSX parsing not implemented');
    }
    validateImportData(data) {
        const errors = [];
        const warnings = [];
        data.forEach((item, index) => {
            if (!item.title) {
                errors.push({
                    row: index + 1,
                    field: 'title',
                    message: 'Title is required'
                });
            }
            if (!item.type) {
                errors.push({
                    row: index + 1,
                    field: 'type',
                    message: 'Type is required'
                });
            }
            if (typeof item.difficulty !== 'number' || item.difficulty < 1 || item.difficulty > 5) {
                errors.push({
                    row: index + 1,
                    field: 'difficulty',
                    message: 'Difficulty must be a number between 1 and 5'
                });
            }
        });
        return { errors, warnings };
    }
    generateCsvBuffer(data) {
        // CSV 생성 로직
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(item => Object.values(item).map(value => typeof value === 'object' ? JSON.stringify(value) : String(value)).join(','));
        return Buffer.from([headers, ...rows].join('\n'));
    }
    generateXlsxBuffer(data) {
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Problems');
        return Buffer.from(xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    }
    calculateEstimatedTime(job) {
        if (job.status === 'completed' || job.status === 'failed') {
            return 0;
        }
        const elapsed = Date.now() - job.startedAt.getTime();
        const progress = Math.max(job.progress, 1);
        const totalEstimated = (elapsed / progress) * 100;
        return Math.max(0, Math.round((totalEstimated - elapsed) / 1000));
    }
    mapToExportResult(data) {
        return {
            fileId: data.file_id,
            fileName: data.file_name,
            fileSize: data.file_size,
            downloadUrl: data.download_url,
            exportedCount: data.exported_count,
            format: data.format,
            expiresAt: new Date(data.expires_at),
            metadata: {
                exportedAt: new Date(data.exported_at),
                exportedBy: data.exported_by,
                filter: data.filter,
                options: data.options
            }
        };
    }
    mapToImportResult(data) {
        return {
            success: data.success,
            importedCount: data.imported_count,
            skippedCount: data.skipped_count,
            errorCount: data.error_count,
            totalCount: data.total_count,
            importedIds: data.imported_ids,
            skippedIds: data.skipped_ids,
            errors: data.errors,
            warnings: data.warnings
        };
    }
}
//# sourceMappingURL=ProblemBankExportService.js.map