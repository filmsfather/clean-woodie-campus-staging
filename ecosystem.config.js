module.exports = {
  apps: [
    {
      name: 'woodie-api',
      script: './packages/api/dist/index.js',
      instances: 'max', // CPU 코어 수만큼 인스턴스 실행
      exec_mode: 'cluster',
      
      // 환경 설정
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // 메모리 및 CPU 제한
      max_memory_restart: '500M',
      
      // 로그 설정
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 재시작 설정
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 헬스체크
      health_check_grace_period: 3000,
      
      // 프로세스 관리
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // 클러스터 설정
      instance_var: 'INSTANCE_ID',
      
      // 소스맵 지원
      source_map_support: true,
      
      // 환경별 설정
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-ec2-public-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/cleanWoodieCampus.git',
      path: '/home/ubuntu/cleanWoodieCampus',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install -y git nodejs npm && npm install -g pnpm pm2'
    },
    
    staging: {
      user: 'ubuntu', 
      host: ['your-staging-ec2-ip'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/cleanWoodieCampus.git',
      path: '/home/ubuntu/cleanWoodieCampus-staging',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt update && apt install -y git nodejs npm && npm install -g pnpm pm2'
    }
  }
};