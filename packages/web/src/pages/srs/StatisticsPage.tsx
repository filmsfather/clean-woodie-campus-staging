import React, { useState } from 'react';
import { SRSStatisticsDashboard } from '../../components/srs';
import { FeatureGuard } from '../../components/auth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

/**
 * SRS 통계 페이지
 * 
 * 사용자의 SRS 학습 통계와 패턴 분석을 보여주는 페이지입니다.
 * 다양한 기간별 통계와 개선 제안을 제공합니다.
 */
export const StatisticsPage: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <FeatureGuard feature="srs" fallback="/dashboard">
      <div className="statistics-page min-h-screen bg-gray-50">
        {/* 헤더 영역 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  학습 통계
                </h1>
                <p className="text-gray-600">
                  당신의 학습 패턴과 성과를 분석하여 더 효과적인 학습을 도와드립니다.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  variant={showAdvanced ? 'primary' : 'outline'}
                  size="sm"
                >
                  {showAdvanced ? '기본 보기' : '고급 분석'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* 메인 대시보드 */}
            <SRSStatisticsDashboard
              showStudyPatterns={showAdvanced}
              autoRefresh={true}
              refreshInterval={300000} // 5분마다 자동 새로고침
            />

            {/* 고급 분석 섹션 */}
            {showAdvanced && (
              <div className="space-y-6">
                {/* 학습 목표 설정 */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">학습 목표</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">매일</div>
                      <div className="text-sm text-gray-600 mb-3">복습 목표</div>
                      <div className="text-xs text-gray-500">
                        현재 달성률: 85%
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">90%</div>
                      <div className="text-sm text-gray-600 mb-3">정답률 목표</div>
                      <div className="text-xs text-gray-500">
                        현재: 78%
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-2">30일</div>
                      <div className="text-sm text-gray-600 mb-3">연속 학습 목표</div>
                      <div className="text-xs text-gray-500">
                        현재: 12일
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 학습 히트맵 */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">학습 활동 히트맵</h3>
                  <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-600">
                    <div className="text-sm mb-2">📊 학습 활동 시각화</div>
                    <div className="text-xs">
                      최근 3개월간의 일별 복습 완료 현황을 히트맵으로 표시합니다.
                      <br />
                      (실제 구현에서는 달력 형태의 히트맵 컴포넌트가 들어갑니다)
                    </div>
                  </div>
                </Card>

                {/* 성취도 배지 */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">성취 배지</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl mb-2">🏆</div>
                      <div className="text-sm font-medium">첫 복습</div>
                      <div className="text-xs text-gray-500">획득함</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl mb-2">📚</div>
                      <div className="text-sm font-medium">주간 완주</div>
                      <div className="text-xs text-gray-500">획득함</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-sm font-medium">정확한 기억</div>
                      <div className="text-xs text-gray-500">획득함</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg opacity-50">
                      <div className="text-3xl mb-2">🔥</div>
                      <div className="text-sm font-medium">30일 연속</div>
                      <div className="text-xs text-gray-500">18일 남음</div>
                    </div>
                  </div>
                </Card>

                {/* 학습 인사이트 */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">개인화된 인사이트</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="font-medium text-blue-800 mb-1">
                        💡 최적 학습 시간대
                      </div>
                      <div className="text-sm text-blue-700">
                        오후 2-4시에 가장 높은 정답률(89%)을 보입니다. 
                        이 시간대에 어려운 복습을 진행해보세요.
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="font-medium text-green-800 mb-1">
                        📈 개선 추세
                      </div>
                      <div className="text-sm text-green-700">
                        지난 주 대비 평균 응답 시간이 15% 단축되었습니다. 
                        학습 효율성이 향상되고 있어요!
                      </div>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <div className="font-medium text-orange-800 mb-1">
                        ⚠️ 주의사항
                      </div>
                      <div className="text-sm text-orange-700">
                        HARD 난이도 문제의 복습 주기가 너무 짧습니다. 
                        조금 더 여유를 두고 복습하는 것이 좋겠어요.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

StatisticsPage.displayName = 'StatisticsPage';

export default StatisticsPage;