import type { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import '../src/index.css';

// MSW 초기화 - UseCase 기반 API mocking을 위해
initialize();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true, // UseCase 기반 문서화를 위한 목차 표시
    },
  },
  // MSW 로더 - 각 스토리에서 http handlers 설정 가능
  loaders: [mswLoader],
  tags: ['autodocs'], // 자동 문서 생성
};

export default preview;