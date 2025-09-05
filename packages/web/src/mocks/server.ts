/**
 * 서버 환경용 MSW Server 설정
 * 테스트 환경에서만 사용됩니다.
 */

// 테스트 환경에서만 MSW Node 서버를 로드
let server: any = null;

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  // 동적 import로 Node 환경에서만 로드
  import('msw/node').then(({ setupServer }) => {
    import('./handlers').then(({ handlers }) => {
      server = setupServer(...handlers);
    });
  }).catch(() => {
    // MSW Node 모듈 로드 실패시 무시
    console.warn('MSW Node 서버 로드 실패');
  });
}

export { server };