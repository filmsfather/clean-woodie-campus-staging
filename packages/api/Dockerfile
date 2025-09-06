# API 서버용 Dockerfile
FROM node:18-alpine

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 루트 package.json과 workspace 설정 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/application/package.json ./packages/application/
COPY packages/domain/package.json ./packages/domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스코드 복사
COPY packages/ ./packages/

# 빌드
RUN pnpm run build

# 프로덕션 의존성만 설치
RUN pnpm prune --prod

EXPOSE 3000

# PM2로 실행
CMD ["pnpm", "start"]