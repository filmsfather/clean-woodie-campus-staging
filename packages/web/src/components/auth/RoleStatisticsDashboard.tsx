import React from 'react';
import { RoleStatistics } from '../../types/auth';
import { Card } from '../ui/Card';
import { RoleFeatureGuard } from './FeatureGuard';

interface RoleStatisticsDashboardProps {
  organizationId?: string;
  statistics?: RoleStatistics | null;
  isLoading?: boolean;
  error?: string | null;
  showExportOptions?: boolean;
}

/**
 * RoleStatisticsDashboard - GetRoleStatisticsUseCase에 대응하는 대시보드 컴포넌트
 * 
 * DDD 원칙 준수:
 * - Domain 지식을 UI에 반영: 각 역할별 통계 의미와 비즈니스 규칙을 UI에서 표현
 * - Aggregate 단위의 데이터 표시: RoleStatistics는 완전한 통계 집계체
 * - 순수한 프레젠테이션 레이어: 계산 로직 없이 표시만 담당
 */
export const RoleStatisticsDashboard: React.FC<RoleStatisticsDashboardProps> = ({
  organizationId: _organizationId,
  statistics,
  isLoading = false,
  error,
  showExportOptions: _showExportOptions = false
}) => {
  // Loading 상태 - 일관된 스켈레톤 UI
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Error 상태 - 사용자 친화적 에러 메시지
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <div className="text-red-600 text-sm mb-4">
            통계 데이터를 불러오는 중 오류가 발생했습니다
          </div>
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      </Card>
    );
  }

  // Empty 상태
  if (!statistics) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <div className="p-6 text-center text-gray-500">
          통계 데이터가 없습니다
        </div>
      </Card>
    );
  }

  // 통계 카드 데이터 - 도메인 지식 반영
  const statisticsCards = [
    {
      title: '전체 사용자',
      value: statistics.totalUsers,
      description: '시스템에 등록된 모든 사용자',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: '학생',
      value: statistics.students,
      description: `전체의 ${((statistics.students / statistics.totalUsers) * 100).toFixed(1)}%`,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: '교사',
      value: statistics.teachers,
      description: `전체의 ${((statistics.teachers / statistics.totalUsers) * 100).toFixed(1)}%`,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: '관리자',
      value: statistics.admins,
      description: `전체의 ${((statistics.admins / statistics.totalUsers) * 100).toFixed(1)}%`,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: '대기중 초대',
      value: statistics.activeInvites,
      description: '아직 수락되지 않은 초대',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: '만료된 초대',
      value: statistics.expiredInvites,
      description: '정리가 필요한 만료된 초대',
      color: 'bg-gray-500',
      textColor: 'text-gray-600'
    }
  ];

  // Success 상태 - 실제 통계 데이터 표시
  return (
    <RoleFeatureGuard.Statistics>
      <div className="space-y-6">
        {/* 메인 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statisticsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </h3>
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                </div>

                {/* 메인 숫자 */}
                <div className={`text-3xl font-bold ${stat.textColor} mb-2`}>
                  {stat.value.toLocaleString()}
                </div>

                {/* 설명 텍스트 */}
                <p className="text-sm text-gray-600">
                  {stat.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* 요약 정보 카드 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              사용자 구성 요약
            </h3>
            
            <div className="space-y-4">
              {/* 역할별 비율 바 */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>역할별 구성비</span>
                  <span>{statistics.totalUsers}명</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                  <div 
                    className="bg-green-500 h-full flex items-center justify-center text-xs text-white"
                    style={{ width: `${(statistics.students / statistics.totalUsers) * 100}%` }}
                  />
                  <div 
                    className="bg-yellow-500 h-full flex items-center justify-center text-xs text-white"
                    style={{ width: `${(statistics.teachers / statistics.totalUsers) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500 h-full flex items-center justify-center text-xs text-white"
                    style={{ width: `${(statistics.admins / statistics.totalUsers) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>학생 {statistics.students}명</span>
                  <span>교사 {statistics.teachers}명</span>
                  <span>관리자 {statistics.admins}명</span>
                </div>
              </div>

              {/* 초대 상태 정보 */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">초대 현황</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">활성 초대</span>
                    <span className="text-sm font-medium text-purple-600">
                      {statistics.activeInvites}건
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">만료된 초대</span>
                    <span className="text-sm font-medium text-gray-600">
                      {statistics.expiredInvites}건
                    </span>
                  </div>
                </div>
                
                {/* 추가 인사이트 - 도메인 지식 활용 */}
                {statistics.expiredInvites > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 {statistics.expiredInvites}개의 만료된 초대를 정리하여 시스템 성능을 향상시킬 수 있습니다.
                    </p>
                  </div>
                )}
                
                {statistics.activeInvites > 10 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📧 {statistics.activeInvites}개의 대기중 초대가 있습니다. 필요시 리마인더를 발송해보세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </RoleFeatureGuard.Statistics>
  );
};

export default RoleStatisticsDashboard;