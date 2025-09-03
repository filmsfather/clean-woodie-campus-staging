import { describe, it, expect, beforeEach } from 'vitest'
import { StudyStreak } from '../../progress/entities/StudyStreak'
import { UniqueEntityID } from '../../common'

describe('StudyStreak', () => {
  let studyStreak: StudyStreak

  beforeEach(() => {
    const props = {
      studentId: new UniqueEntityID('student-1'),
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: new Date('2025-01-01')
    }
    const result = StudyStreak.create(props, new UniqueEntityID('streak-1'))
    studyStreak = result.value
  })

  describe('recordStudy', () => {
    it('should start a new streak when recording first study', () => {
      const studyDate = new Date('2025-01-01')
      
      studyStreak.recordStudy(studyDate)
      
      expect(studyStreak.currentStreak).toBe(1)
      expect(studyStreak.longestStreak).toBe(1)
      expect(studyStreak.lastStudyDate).toEqual(studyDate)
    })

    it('should increment streak when studying on consecutive days', () => {
      const day1 = new Date('2025-01-01')
      const day2 = new Date('2025-01-02')
      const day3 = new Date('2025-01-03')
      
      studyStreak.recordStudy(day1)
      studyStreak.recordStudy(day2)
      studyStreak.recordStudy(day3)
      
      expect(studyStreak.currentStreak).toBe(3)
      expect(studyStreak.longestStreak).toBe(3)
    })

    it('should not increment streak when studying on the same day', () => {
      const studyDate = new Date('2025-01-01')
      
      studyStreak.recordStudy(studyDate)
      studyStreak.recordStudy(studyDate) // 같은 날 재학습
      
      expect(studyStreak.currentStreak).toBe(1)
    })

    it('should reset current streak but keep longest when gap occurs', () => {
      const day1 = new Date('2025-01-01')
      const day2 = new Date('2025-01-02')
      const day4 = new Date('2025-01-04') // 하루 건너뜀
      
      studyStreak.recordStudy(day1)
      studyStreak.recordStudy(day2)
      studyStreak.recordStudy(day4)
      
      expect(studyStreak.currentStreak).toBe(1) // 리셋됨
      expect(studyStreak.longestStreak).toBe(2) // 이전 최고 기록 유지
    })

    it('should trigger milestone achievement at 7 days', () => {
      const initialEvents = studyStreak.domainEvents.length
      
      // 7일 연속 학습
      for (let i = 1; i <= 7; i++) {
        const studyDate = new Date(`2025-01-${i.toString().padStart(2, '0')}`)
        studyStreak.recordStudy(studyDate)
      }
      
      expect(studyStreak.currentStreak).toBe(7)
      expect(studyStreak.domainEvents.length).toBeGreaterThan(initialEvents)
    })

    it('should trigger milestone achievement at 30 days', () => {
      const initialEvents = studyStreak.domainEvents.length
      
      // 30일 연속 학습
      for (let i = 1; i <= 30; i++) {
        const studyDate = new Date(2025, 0, i) // 2025년 1월
        studyStreak.recordStudy(studyDate)
      }
      
      expect(studyStreak.currentStreak).toBe(30)
      expect(studyStreak.domainEvents.length).toBeGreaterThan(initialEvents)
    })
  })

  describe('isActiveStreak', () => {
    it('should return true when studied today', () => {
      const today = new Date()
      studyStreak.recordStudy(today)
      
      expect(studyStreak.isActiveStreak()).toBe(true)
    })

    it('should return true when studied yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      studyStreak.recordStudy(yesterday)
      
      expect(studyStreak.isActiveStreak()).toBe(true)
    })

    it('should return false when last study was 2 days ago', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      studyStreak.recordStudy(twoDaysAgo)
      
      expect(studyStreak.isActiveStreak()).toBe(false)
    })
  })

  describe('isAtRisk', () => {
    it('should return true when last study was yesterday and streak >= 3', () => {
      // 3일 연속 학습 후 어제가 마지막
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      studyStreak.recordStudy(threeDaysAgo)
      studyStreak.recordStudy(twoDaysAgo)
      studyStreak.recordStudy(yesterday)
      
      expect(studyStreak.isAtRisk()).toBe(true)
    })

    it('should return false when streak is less than 3', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      studyStreak.recordStudy(yesterday)
      
      expect(studyStreak.currentStreak).toBe(1)
      expect(studyStreak.isAtRisk()).toBe(false)
    })

    it('should return false when studied today', () => {
      const today = new Date()
      studyStreak.recordStudy(today)
      
      expect(studyStreak.isAtRisk()).toBe(false)
    })
  })


  describe('domain events', () => {
    it('should publish StreakAchievedEvent when milestone is reached', () => {
      // 7일 연속 학습으로 이정표 달성
      for (let i = 1; i <= 7; i++) {
        const studyDate = new Date(`2025-01-${i.toString().padStart(2, '0')}`)
        studyStreak.recordStudy(studyDate)
      }
      
      const events = studyStreak.domainEvents
      const streakEvent = events.find(event => event.constructor.name === 'StreakAchievedEvent')
      
      expect(streakEvent).toBeDefined()
    })
  })
})