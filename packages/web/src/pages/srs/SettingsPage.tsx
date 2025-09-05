import React, { useState } from 'react';
import { NotificationSettings } from '../../components/srs';
import { FeatureGuard } from '../../components/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

/**
 * SRS 설정 페이지
 * 
 * 사용자의 SRS 관련 설정을 관리하는 페이지입니다.
 * 알림 설정, 복습 설정, 개인화 옵션 등을 제공합니다.
 */
export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'review' | 'personalization'>('notifications');
  const [reviewSettings, setReviewSettings] = useState({
    maxDailyReviews: 50,
    preferredDifficulty: 'MEDIUM',
    autoNextReview: true,
    keyboardShortcuts: true,
    showHints: true,
    sessionTimeLimit: 30
  });

  const handleReviewSettingsSave = () => {
    // 실제 구현에서는 API 호출로 설정 저장
    console.log('복습 설정 저장:', reviewSettings);
  };

  const tabs = [
    {
      id: 'notifications' as const,
      label: '알림',
      icon: '🔔'
    },
    {
      id: 'review' as const,
      label: '복습',
      icon: '📚'
    },
    {
      id: 'personalization' as const,
      label: '개인화',
      icon: '⚙️'
    }
  ];

  return (
    <FeatureGuard feature="srs" fallback="/dashboard">
      <div className="settings-page min-h-screen bg-gray-50">
        {/* 헤더 영역 */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                SRS 설정
              </h1>
              <p className="text-gray-600">
                복습 시스템을 개인의 학습 스타일에 맞게 커스터마이즈하세요.
              </p>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* 사이드바 - 탭 네비게이션 */}
            <div className="w-64 flex-shrink-0">
              <Card>
                <div className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 space-y-6">
              {/* 알림 설정 탭 */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">알림 설정</h2>
                    <p className="text-gray-600">
                      복습 알림과 리마인더를 개인의 일정에 맞게 설정하세요.
                    </p>
                  </div>
                  
                  <NotificationSettings
                    onSettingsUpdated={() => {
                      console.log('알림 설정이 업데이트되었습니다');
                    }}
                    showStatus={true}
                  />
                </div>
              )}

              {/* 복습 설정 탭 */}
              {activeTab === 'review' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">복습 설정</h2>
                    <p className="text-gray-600">
                      복습 세션의 동작 방식과 개인화 옵션을 설정하세요.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* 기본 복습 설정 */}
                    <Card>
                      <h3 className="text-lg font-semibold mb-4">기본 설정</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block font-medium mb-2">
                            일일 최대 복습 수
                          </label>
                          <Input
                            type="number"
                            value={reviewSettings.maxDailyReviews}
                            onChange={(e) => setReviewSettings(prev => ({
                              ...prev,
                              maxDailyReviews: parseInt(e.target.value) || 0
                            }))}
                            min={1}
                            max={200}
                            className="w-32"
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            하루에 진행할 수 있는 최대 복습 개수를 설정합니다
                          </div>
                        </div>

                        <div>
                          <label className="block font-medium mb-2">
                            선호 난이도
                          </label>
                          <Select
                            value={reviewSettings.preferredDifficulty}
                            onChange={(value) => setReviewSettings(prev => ({
                              ...prev,
                              preferredDifficulty: value as 'EASY' | 'MEDIUM' | 'HARD'
                            }))}
                            className="w-40"
                          >
                            <option value="EASY">쉬움</option>
                            <option value="MEDIUM">보통</option>
                            <option value="HARD">어려움</option>
                          </Select>
                          <div className="text-sm text-gray-500 mt-1">
                            새로운 문제가 추가될 때 기본 난이도를 설정합니다
                          </div>
                        </div>

                        <div>
                          <label className="block font-medium mb-2">
                            세션 제한 시간 (분)
                          </label>
                          <Input
                            type="number"
                            value={reviewSettings.sessionTimeLimit}
                            onChange={(e) => setReviewSettings(prev => ({
                              ...prev,
                              sessionTimeLimit: parseInt(e.target.value) || 0
                            }))}
                            min={5}
                            max={120}
                            className="w-32"
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            한 번의 복습 세션에 대한 시간 제한을 설정합니다
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* UI 옵션 */}
                    <Card>
                      <h3 className="text-lg font-semibold mb-4">인터페이스 옵션</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">자동 다음 문제 이동</div>
                            <div className="text-sm text-gray-600">
                              피드백 제출 후 자동으로 다음 문제로 이동합니다
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={reviewSettings.autoNextReview}
                            onChange={(e) => setReviewSettings(prev => ({
                              ...prev,
                              autoNextReview: e.target.checked
                            }))}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">키보드 단축키 사용</div>
                            <div className="text-sm text-gray-600">
                              숫자키(1-4)와 화살표키로 빠른 복습이 가능합니다
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={reviewSettings.keyboardShortcuts}
                            onChange={(e) => setReviewSettings(prev => ({
                              ...prev,
                              keyboardShortcuts: e.target.checked
                            }))}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">힌트 표시</div>
                            <div className="text-sm text-gray-600">
                              어려운 문제에 대한 힌트를 표시합니다
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={reviewSettings.showHints}
                            onChange={(e) => setReviewSettings(prev => ({
                              ...prev,
                              showHints: e.target.checked
                            }))}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* 저장 버튼 */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleReviewSettingsSave}
                        variant="primary"
                      >
                        설정 저장
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 개인화 설정 탭 */}
              {activeTab === 'personalization' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">개인화 설정</h2>
                    <p className="text-gray-600">
                      AI가 당신의 학습 패턴을 분석하여 최적화된 복습 경험을 제공하도록 설정하세요.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* AI 개인화 옵션 */}
                    <Card>
                      <h3 className="text-lg font-semibold mb-4">AI 개인화</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">적응형 난이도 조절</div>
                            <div className="text-sm text-gray-600">
                              성과에 따라 자동으로 문제 난이도를 조절합니다
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">학습 패턴 분석</div>
                            <div className="text-sm text-gray-600">
                              최적의 복습 시간과 주기를 자동으로 찾습니다
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">개인화된 추천</div>
                            <div className="text-sm text-gray-600">
                              학습 목표와 진도에 맞는 복습 계획을 제안합니다
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* 데이터 및 개인정보 */}
                    <Card>
                      <h3 className="text-lg font-semibold mb-4">데이터 및 개인정보</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Button variant="outline" size="sm">
                            학습 데이터 내보내기
                          </Button>
                          <div className="text-sm text-gray-500 mt-1">
                            내 복습 기록과 통계를 JSON 형태로 내보냅니다
                          </div>
                        </div>

                        <div>
                          <Button variant="outline" size="sm">
                            복습 기록 초기화
                          </Button>
                          <div className="text-sm text-gray-500 mt-1">
                            모든 복습 기록을 삭제하고 새로 시작합니다
                          </div>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-yellow-600">⚠️</span>
                            <div>
                              <div className="font-medium text-yellow-800 mb-1">
                                데이터 사용 동의
                              </div>
                              <div className="text-sm text-yellow-700">
                                더 나은 학습 경험을 위해 익명화된 학습 데이터를 분석에 활용할 수 있습니다. 
                                개인을 식별할 수 있는 정보는 포함되지 않습니다.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

SettingsPage.displayName = 'SettingsPage';

export default SettingsPage;