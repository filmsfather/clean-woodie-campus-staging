#!/usr/bin/env node

/**
 * 스테이징 환경용 빌드 스크립트
 * 기능 플래그에 따라 조건부 컴파일 수행
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting staging build with feature flags...')

// 환경변수 설정
process.env.NODE_ENV = 'staging'

try {
  // 스테이징용 tsconfig 사용하여 빌드
  console.log('📦 Building with staging configuration...')
  execSync('tsc --build tsconfig.staging.json', { 
    stdio: 'inherit',
    cwd: __dirname + '/..'
  })
  
  // 기능 플래그 상태 출력
  const { featureFlags } = await import('../dist/common/config/FeatureFlags.js')
  console.log('✅ Build completed successfully!')
  console.log('🏗️  Active features in staging:')
  
  const enabledFeatures = featureFlags.getEnabledFeatures()
  enabledFeatures.forEach(feature => {
    console.log(`   ✓ ${feature}`)
  })
  
  const allFlags = featureFlags.getAllFlags()
  const disabledFeatures = Object.entries(allFlags)
    .filter(([_, enabled]) => !enabled)
    .map(([feature, _]) => feature)
  
  if (disabledFeatures.length > 0) {
    console.log('🚫 Disabled features in staging:')
    disabledFeatures.forEach(feature => {
      console.log(`   ✗ ${feature}`)
    })
  }

} catch (error) {
  console.error('❌ Staging build failed:', error.message)
  process.exit(1)
}