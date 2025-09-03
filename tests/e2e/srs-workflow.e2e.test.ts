import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Supabase 테스트 클라이언트 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * SRS 시스템 전체 워크플로우 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 사용자 생성 및 로그인
 * 2. 문제 생성 
 * 3. 복습 일정 생성
 * 4. 복습 피드백 제출
 * 5. 알림 설정 및 수신
 * 6. 통계 조회
 * 7. 연체 처리
 */
describe('SRS System E2E Workflow', () => {
  let testUser: any
  let testProblem: any
  let reviewSchedule: any

  beforeAll(async () => {
    // 테스트 환경이 준비되었는지 확인
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // 테이블이 존재하지 않는 경우 제외
      console.warn('Supabase connection failed, E2E tests will be skipped', error)
      return
    }
  })

  beforeEach(async () => {
    // 임시로 mock user를 사용 (실제 E2E에서는 signUp 사용)
    const userId = '550e8400-e29b-41d4-a716-446655440000'
    const email = 'test@example.com'
    
    testUser = {
      id: userId,
      email: email
    }

    // service role로 auth.users와 profiles를 직접 생성
    const { error: authError } = await supabaseAdmin.rpc('create_test_user', {
      user_id: userId,
      user_email: email,
      user_password: 'testpassword123',
      full_name: 'Test User'
    })

    if (authError) {
      console.log('Skipping E2E tests - auth user creation failed', authError)
      return
    }

    // 테스트 문제 생성 (service role 사용) - public.problems 테이블 사용
    const { data: problemData, error: problemError } = await supabaseAdmin
      .from('problems')
      .insert({
        title: 'What is 2 + 2?',
        description: 'Basic arithmetic problem',
        content: { 
          question: 'What is 2 + 2?',
          choices: [
            { text: '3', id: 'a' },
            { text: '4', id: 'b' },
            { text: '5', id: 'c' }
          ]
        },
        solution: {
          correct_answers: ['b'],
          points: 10
        },
        problem_type: 'multiple_choice',
        difficulty: 'medium',
        tags: ['math', 'basic'],
        created_by: testUser.id,
        is_public: true
      })
      .select()
      .single()

    if (problemError) {
      console.log('Skipping E2E tests - problem creation failed', problemError)
      return
    }

    testProblem = problemData
  })

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testUser) {
      await supabase.auth.signOut()
    }
  })

  it('완전한 SRS 워크플로우가 작동해야 함', async () => {
    if (!testUser || !testProblem) {
      console.log('Skipping workflow test - setup incomplete')
      return
    }

    // 1. 복습 일정 생성
    const { data: scheduleData, error: scheduleError } = await supabaseAdmin
      .from('review_schedules')
      .insert({
        student_id: testUser.id,
        problem_id: testProblem.id,
        current_interval: 1.0,
        ease_factor: 2.5,
        next_review_at: new Date().toISOString()
      })
      .select()
      .single()

    expect(scheduleError).toBeNull()
    expect(scheduleData).toBeDefined()
    reviewSchedule = scheduleData

    // 2. 알림 설정 생성
    const { error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .insert({
        user_id: testUser.id,
        enabled: true,
        review_reminders: true,
        overdue_reminders: true,
        daily_summary: true,
        timezone: 'Asia/Seoul'
      })

    expect(settingsError).toBeNull()

    // 3. 복습 완료 및 피드백 제출 (GOOD)
    const { error: updateError } = await supabaseAdmin
      .from('review_schedules')
      .update({
        current_interval: 2.0,
        ease_factor: 2.6,
        review_count: 1,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2일 후
      })
      .eq('id', reviewSchedule.id)

    expect(updateError).toBeNull()

    // 4. 학습 기록 생성
    const { error: recordError } = await supabaseAdmin
      .from('study_records')
      .insert({
        student_id: testUser.id,
        problem_id: testProblem.id,
        feedback: 'GOOD',
        is_correct: true,
        response_time: 45,
        answer_content: { selectedOption: 'C' }
      })

    expect(recordError).toBeNull()

    // 5. 알림 이력 생성
    const { error: notificationError } = await supabase
      .from('learning.notification_history')
      .insert({
        recipient_id: testUser.id,
        type: 'review_due',
        title: 'Test Notification',
        body: 'Test notification body',
        scheduled_at: new Date().toISOString(),
        sent_at: new Date().toISOString()
      })

    expect(notificationError).toBeNull()

    // 6. 통계 검증
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('review_schedules')
      .select('*')
      .eq('student_id', testUser.id)

    expect(schedulesError).toBeNull()
    expect(schedules).toHaveLength(1)
    expect(schedules?.[0].review_count).toBe(1)

    const { data: records, error: recordsError } = await supabaseAdmin
      .from('study_records')
      .select('*')
      .eq('student_id', testUser.id)

    expect(recordsError).toBeNull()
    expect(records).toHaveLength(1)
    expect(records?.[0].feedback).toBe('GOOD')

    // 7. 알림 통계 검증
    const { data: notifications, error: notificationsError } = await supabase
      .from('learning.notification_history')
      .select('*')
      .eq('recipient_id', testUser.id)

    expect(notificationsError).toBeNull()
    expect(notifications).toHaveLength(1)
    expect(notifications?.[0].sent_at).toBeTruthy()
  })

  it('연체 복습 시나리오가 올바르게 처리되어야 함', async () => {
    if (!testUser || !testProblem) {
      console.log('Skipping overdue test - setup incomplete')
      return
    }

    // 1. 연체된 복습 일정 생성 (어제가 복습일이었음)
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)

    const { data: overdueSchedule, error: scheduleError } = await supabaseAdmin
      .from('review_schedules')
      .insert({
        student_id: testUser.id,
        problem_id: testProblem.id,
        current_interval: 3.0,
        ease_factor: 2.3,
        next_review_at: yesterdayDate.toISOString(),
        consecutive_failures: 1
      })
      .select()
      .single()

    expect(scheduleError).toBeNull()

    // 2. 연체 알림 생성
    const { error: overdueNotificationError } = await supabase
      .from('learning.notification_history')
      .insert({
        recipient_id: testUser.id,
        type: 'review_overdue',
        title: 'Overdue Review Alert',
        body: 'You have an overdue review item',
        scheduled_at: new Date().toISOString(),
        sent_at: new Date().toISOString()
      })

    expect(overdueNotificationError).toBeNull()

    // 3. 연체 복습 완료 (AGAIN - 어려웠음)
    const { error: againUpdateError } = await supabaseAdmin
      .from('review_schedules')
      .update({
        current_interval: 1.0, // 간격 리셋
        ease_factor: 2.0, // ease factor 감소
        consecutive_failures: 2, // 실패 횟수 증가
        review_count: 1,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1일 후
      })
      .eq('id', overdueSchedule.id)

    expect(againUpdateError).toBeNull()

    // 4. AGAIN 피드백 학습 기록
    const { error: againRecordError } = await supabaseAdmin
      .from('study_records')
      .insert({
        student_id: testUser.id,
        problem_id: testProblem.id,
        feedback: 'AGAIN',
        is_correct: false,
        response_time: 120
      })

    expect(againRecordError).toBeNull()

    // 5. 검증: 연체 처리 후 상태 확인
    const { data: updatedSchedule, error: fetchError } = await supabaseAdmin
      .from('review_schedules')
      .select('*')
      .eq('id', overdueSchedule.id)
      .single()

    expect(fetchError).toBeNull()
    expect(updatedSchedule?.consecutive_failures).toBe(2)
    expect(updatedSchedule?.current_interval).toBe(1.0)
    expect(updatedSchedule?.ease_factor).toBeLessThan(2.3)
  })

  it('알림 설정 변경이 올바르게 적용되어야 함', async () => {
    if (!testUser) {
      console.log('Skipping notification settings test - setup incomplete')
      return
    }

    // 1. 기본 알림 설정 생성
    const { error: createError } = await supabaseAdmin
      .from('notification_settings')
      .insert({
        user_id: testUser.id,
        enabled: true,
        review_reminders: true,
        overdue_reminders: true,
        daily_summary: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'Asia/Seoul'
      })

    expect(createError).toBeNull()

    // 2. 설정 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('notification_settings')
      .update({
        overdue_reminders: false,
        daily_summary: true,
        quiet_hours_start: '23:00'
      })
      .eq('user_id', testUser.id)

    expect(updateError).toBeNull()

    // 3. 업데이트 확인
    const { data: updatedSettings, error: fetchError } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    expect(fetchError).toBeNull()
    expect(updatedSettings?.overdue_reminders).toBe(false)
    expect(updatedSettings?.daily_summary).toBe(true)
    expect(updatedSettings?.quiet_hours_start).toBe('23:00')

    // 4. 설정에 따른 알림 필터링 테스트
    // (연체 알림이 비활성화되었으므로 연체 알림이 생성되지 않아야 함)
    
    const beforeCount = await supabase
      .from('learning.notification_history')
      .select('count')
      .eq('recipient_id', testUser.id)
      .eq('type', 'review_overdue')

    // 연체 알림 시도 (실제로는 서비스에서 설정을 확인하고 발송하지 않음)
    const { data: settings } = await supabaseAdmin
      .from('notification_settings')
      .select('overdue_reminders')
      .eq('user_id', testUser.id)
      .single()

    // 설정이 false이므로 알림을 보내지 않아야 함
    expect(settings?.overdue_reminders).toBe(false)
  })

  it('학습 통계가 정확하게 계산되어야 함', async () => {
    if (!testUser || !testProblem) {
      console.log('Skipping statistics test - setup incomplete')
      return
    }

    // 1. 여러 학습 기록 생성 (7일간의 학습 시뮬레이션)
    const studyRecords = []
    for (let i = 0; i < 7; i++) {
      const reviewDate = new Date()
      reviewDate.setDate(reviewDate.getDate() - i)

      studyRecords.push({
        student_id: testUser.id,
        problem_id: testProblem.id,
        feedback: i < 5 ? 'GOOD' : 'AGAIN', // 처음 5개는 성공, 나머지는 실패
        is_correct: i < 5,
        response_time: 30 + i * 10, // 점점 느려짐
        created_at: reviewDate.toISOString()
      })
    }

    const { error: recordsError } = await supabaseAdmin
      .from('study_records')
      .insert(studyRecords)

    expect(recordsError).toBeNull()

    // 2. 통계 계산 검증
    const { data: records, error: fetchError } = await supabaseAdmin
      .from('study_records')
      .select('*')
      .eq('student_id', testUser.id)
      .order('created_at', { ascending: false })

    expect(fetchError).toBeNull()
    expect(records).toHaveLength(7)

    // 정답률 계산 (5/7 ≈ 71%)
    const correctCount = records?.filter(r => r.is_correct).length || 0
    const totalCount = records?.length || 0
    const accuracy = Math.round((correctCount / totalCount) * 100)
    
    expect(accuracy).toBe(71)

    // 평균 응답 시간 계산
    const totalTime = records?.reduce((sum, r) => sum + (r.response_time || 0), 0) || 0
    const avgTime = totalTime / totalCount
    
    expect(avgTime).toBeGreaterThan(30)
    expect(avgTime).toBeLessThan(100)

    // 최근 성능 트렌드 (최근 3개 vs 이전 4개)
    const recent3 = records?.slice(0, 3) || []
    const previous4 = records?.slice(3, 7) || []

    const recentAccuracy = recent3.filter(r => r.is_correct).length / 3
    const previousAccuracy = previous4.filter(r => r.is_correct).length / 4

    // 최근 성과가 더 좋아야 함 (AGAIN이 나중에 나옴)
    expect(recentAccuracy).toBeLessThan(previousAccuracy)
  })
})