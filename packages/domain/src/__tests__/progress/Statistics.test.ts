import { describe, it, expect, beforeEach } from 'vitest'
import { Statistics } from '../../progress/entities/Statistics'
import { UniqueEntityID } from '../../common'

describe('Statistics', () => {
  let statistics: Statistics

  beforeEach(() => {
    const props = {
      studentId: new UniqueEntityID('student-1'),
      problemSetId: new UniqueEntityID('problemset-1'),
      totalProblems: 10,
      completedProblems: 0,
      correctAnswers: 0,
      totalTimeSpent: 0,
      averageResponseTime: 0
    }
    const result = Statistics.create(props, new UniqueEntityID('stats-1'))
    statistics = result.value
  })

  describe('recordStudyResult', () => {
    it('should update basic statistics for correct answer', () => {
      statistics.recordStudyResult(true, 5000)

      expect(statistics.completedProblems).toBe(1)
      expect(statistics.correctAnswers).toBe(1)
      expect(statistics.getAccuracyRate()).toBe(100)
      expect(statistics.averageResponseTime).toBe(5000)
    })

    it('should update basic statistics for incorrect answer', () => {
      statistics.recordStudyResult(false, 8000)

      expect(statistics.completedProblems).toBe(1)
      expect(statistics.correctAnswers).toBe(0)
      expect(statistics.getAccuracyRate()).toBe(0)
      expect(statistics.averageResponseTime).toBe(8000)
    })

    it('should calculate average accuracy correctly over multiple attempts', () => {
      statistics.recordStudyResult(true, 5000)
      statistics.recordStudyResult(false, 6000)
      statistics.recordStudyResult(true, 4000)

      expect(statistics.completedProblems).toBe(3)
      expect(statistics.correctAnswers).toBe(2)
      expect(Math.round(statistics.getAccuracyRate() * 10) / 10).toBe(66.7) // 2/3 * 100, rounded to 1 decimal
      expect(statistics.averageResponseTime).toBe(5000) // (5000+6000+4000)/3
    })

  })

  describe('getCompletionRate', () => {
    it('should calculate completion rate correctly', () => {
      statistics.recordStudyResult(true, 5000)
      statistics.recordStudyResult(false, 6000)
      
      expect(statistics.getCompletionRate()).toBe(20) // 2 out of 10 problems completed
    })
  })

  describe('isCompleted', () => {
    it('should return true when all problems are completed', () => {
      // Complete all 10 problems
      for (let i = 0; i < 10; i++) {
        statistics.recordStudyResult(true, 5000)
      }
      
      expect(statistics.isCompleted()).toBe(true)
    })

    it('should return false when not all problems are completed', () => {
      statistics.recordStudyResult(true, 5000)
      
      expect(statistics.isCompleted()).toBe(false)
    })
  })

  describe('getProgressStatus', () => {
    it('should return "not_started" when no problems completed', () => {
      expect(statistics.getProgressStatus()).toBe('not_started')
    })

    it('should return "in_progress" when some problems completed', () => {
      statistics.recordStudyResult(true, 5000)
      
      expect(statistics.getProgressStatus()).toBe('in_progress')
    })

    it('should return "completed" when all problems completed', () => {
      // Complete all 10 problems
      for (let i = 0; i < 10; i++) {
        statistics.recordStudyResult(true, 5000)
      }
      
      expect(statistics.getProgressStatus()).toBe('completed')
    })
  })

  describe('domain events', () => {
    it('should publish StatisticsUpdatedEvent when statistics change', () => {
      const initialEventCount = statistics.domainEvents.length
      
      statistics.recordStudyResult(true, 5000)
      
      expect(statistics.domainEvents.length).toBeGreaterThan(initialEventCount)
      
      const statisticsEvent = statistics.domainEvents.find(
        event => event.constructor.name === 'StatisticsUpdatedEvent'
      )
      expect(statisticsEvent).toBeDefined()
    })
  })
})