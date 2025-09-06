#!/bin/bash

# 로그 디렉토리 생성
mkdir -p /app/logs

# Nginx 설정 테스트
nginx -t

# 백그라운드에서 Nginx 시작
nginx -g "daemon off;" &

# PM2로 API 서버 시작
cd /app
pm2-runtime start ecosystem.config.js --env production