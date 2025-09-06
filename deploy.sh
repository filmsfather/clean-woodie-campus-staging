#!/bin/bash

# EC2 배포 스크립트
set -e

# 환경 변수 설정
ENVIRONMENT=${1:-production}
EC2_HOST=${2:-your-ec2-public-ip}
EC2_USER=${3:-ubuntu}
SSH_KEY_PATH=${4:-~/.ssh/id_rsa}
APP_NAME="cleanWoodieCampus"
DEPLOY_PATH="/home/$EC2_USER/$APP_NAME"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# SSH 연결 테스트
echo "📡 Testing SSH connection..."
ssh -o ConnectTimeout=10 -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "echo 'SSH connection successful'"

# Git 최신 코드 풀
echo "📥 Pulling latest code..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "
    cd $DEPLOY_PATH
    git fetch origin
    git reset --hard origin/main
"

# Docker 이미지 빌드
echo "🐳 Building Docker image..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "
    cd $DEPLOY_PATH
    docker build -t $APP_NAME:latest .
"

# 기존 컨테이너 중지 및 제거
echo "🛑 Stopping existing containers..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "
    docker stop $APP_NAME || true
    docker rm $APP_NAME || true
"

# 새 컨테이너 실행
echo "🔄 Starting new container..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "
    docker run -d \
        --name $APP_NAME \
        --restart unless-stopped \
        -p 80:80 \
        -p 3000:3000 \
        --env-file /home/$EC2_USER/.env.production \
        $APP_NAME:latest
"

# 헬스체크
echo "🏥 Performing health check..."
sleep 10

HEALTH_CHECK=$(ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "
    curl -f http://localhost/health || echo 'FAILED'
")

if [ "$HEALTH_CHECK" = "FAILED" ]; then
    echo "❌ Health check failed! Rolling back..."
    # 롤백 로직 추가
    exit 1
fi

# 이전 이미지 정리
echo "🧹 Cleaning up old images..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "
    docker image prune -f
"

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://$EC2_HOST"