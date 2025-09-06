# 단일 EC2 인스턴스용 멀티 스테이지 Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 파일들 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스코드 복사
COPY packages/ ./packages/
COPY tsconfig.json ./

# 빌드 (프론트엔드 + 백엔드)
RUN pnpm run build

# 프로덕션 스테이지
FROM node:18-alpine

WORKDIR /app

# 필요한 패키지 설치
RUN apk add --no-cache nginx

# pnpm과 PM2 설치
RUN npm install -g pnpm pm2

# 의존성 파일들 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/application/package.json ./packages/application/
COPY packages/domain/package.json ./packages/domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/

# 프로덕션 의존성만 설치
RUN pnpm install --frozen-lockfile --prod

# 빌드된 파일들 복사
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/application/dist ./packages/application/dist
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/packages/infrastructure/dist ./packages/infrastructure/dist
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/nginx.conf

# PM2 ecosystem 설정 복사
COPY ecosystem.config.js ./

# 실행 스크립트 복사
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 80 3000

CMD ["./start.sh"]