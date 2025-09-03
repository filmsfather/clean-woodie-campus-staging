import { Result } from '@woodie/domain';
// 개발환경용 이메일 어댑터 - 콘솔에 로그 출력
export class ConsoleEmailAdapter {
    async sendEmail(request) {
        try {
            // 콘솔에 이메일 내용 출력
            console.log('\n=== EMAIL SENT (Console Adapter) ===');
            console.log(`To: ${request.to}`);
            console.log(`Subject: ${request.subject}`);
            console.log(`HTML Length: ${request.html.length} chars`);
            if (request.text) {
                console.log(`Text Content:\n${request.text}`);
            }
            console.log(`HTML Content:\n${request.html}`);
            console.log('=====================================\n');
            // 가짜 메시지 ID와 성공 상태 반환
            const result = {
                messageId: `console-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: 'sent'
            };
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`Console email adapter error: ${error}`);
        }
    }
}
//# sourceMappingURL=ConsoleEmailAdapter.js.map