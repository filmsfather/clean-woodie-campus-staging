import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// MSW 개발 환경 설정 - UseCase 기반 API mocking
async function enableMocking() {
  // 개발 환경이면서 MSW가 활성화된 경우에만 실행
  if (process.env.NODE_ENV !== 'development' || typeof __MSW_ENABLED__ === 'undefined' || !__MSW_ENABLED__) {
    return
  }

  try {
    // 동적 import로 MSW 모듈 로드 (번들에 포함되지 않음)
    const { worker } = await import('./mocks')

    // MSW Worker 시작
    return worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
  } catch (error) {
    // MSW 모듈 로드 실패 시 경고만 출력하고 계속 진행
    console.warn('MSW 초기화 실패:', error)
    return
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})