/**
 * Database Configuration (Supabase Client)
 * API 레이어에서 사용하는 Supabase 클라이언트 설정
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 로드
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required')
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
}

/**
 * Supabase 클라이언트 인스턴스
 * Service Role Key를 사용하여 서버 사이드에서 모든 권한으로 접근
 */
export const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * 개발/테스트 환경용 연결 테스트 함수
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.warn('Database connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

/**
 * 데이터베이스 연결 상태 확인
 */
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  timestamp: Date
  latency?: number
}> {
  const startTime = Date.now()
  
  try {
    await supabaseClient
      .from('users')
      .select('id')
      .limit(1)
    
    const latency = Date.now() - startTime
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      latency
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date()
    }
  }
}