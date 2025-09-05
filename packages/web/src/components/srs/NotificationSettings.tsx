import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { useSRSNotifications } from '../../hooks';

// 컴포넌트 props 타입
interface NotificationSettingsProps {
  className?: string;
  onSettingsUpdated?: () => void;  // 설정 업데이트 콜백
  showStatus?: boolean;  // 알림 상태 표시 여부
}

/**
 * SRS 알림 설정 컴포넌트
 * 
 * 사용자의 SRS 알림 설정을 관리하는 컴포넌트입니다.
 * 알림 활성화, 조용한 시간, 지연 설정 등을 제공합니다.
 */
export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  onSettingsUpdated,
  showStatus = true
}) => {
  // 임시 설정 상태 (폼 데이터)
  const [tempSettings, setTempSettings] = useState({
    overdueDelayMinutes: 30,
    reminderAdvanceMinutes: 60,
    quietStart: '22:00',
    quietEnd: '08:00',
    quietEnabled: false
  });

  const {
    status,
    settings,
    isLoading,
    isSaving,
    hasUnreadNotifications,
    overdueCount,
    upcomingCount,
    toggleNotifications,
    toggleOverdueNotifications,
    toggleReminderNotifications,
    updateQuietHours,
    updateDelaySettings,
    triggerOverdueNotification,
    refresh,
    isNotificationEnabled,
    isInQuietHours,
    formatLastChecked,
    state
  } = useSRSNotifications({
    autoLoad: true,
    onSettingsChanged: (newSettings) => {
      setTempSettings({
        overdueDelayMinutes: newSettings.overdueDelayMinutes,
        reminderAdvanceMinutes: newSettings.reminderAdvanceMinutes,
        quietStart: newSettings.quietHours.start,
        quietEnd: newSettings.quietHours.end,
        quietEnabled: newSettings.quietHours.enabled
      });
      
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    }
  });

  // 설정이 로드되면 임시 설정 초기화
  React.useEffect(() => {
    if (settings) {
      setTempSettings({
        overdueDelayMinutes: settings.overdueDelayMinutes,
        reminderAdvanceMinutes: settings.reminderAdvanceMinutes,
        quietStart: settings.quietHours.start,
        quietEnd: settings.quietHours.end,
        quietEnabled: settings.quietHours.enabled
      });
    }
  }, [settings]);

  // 조용한 시간 업데이트
  const handleQuietHoursUpdate = async () => {
    await updateQuietHours(
      tempSettings.quietStart,
      tempSettings.quietEnd,
      tempSettings.quietEnabled
    );
  };

  // 지연 설정 업데이트
  const handleDelaySettingsUpdate = async () => {
    await updateDelaySettings(
      tempSettings.overdueDelayMinutes,
      tempSettings.reminderAdvanceMinutes
    );
  };

  // 모든 설정 저장
  const handleSaveAllSettings = async () => {
    await Promise.all([
      handleQuietHoursUpdate(),
      handleDelaySettingsUpdate()
    ]);
  };

  // 로딩 상태
  if (isLoading && !settings) {
    return (
      <div className={`notification-settings ${className}`}>
        <Card>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`notification-settings ${className}`}>
      {/* 알림 상태 (선택적 표시) */}
      {showStatus && status && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">알림 상태</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {hasUnreadNotifications ? '📬' : '📭'}
              </div>
              <div className="text-sm text-gray-600">
                {hasUnreadNotifications ? '읽지 않은 알림 있음' : '새 알림 없음'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {overdueCount}
              </div>
              <div className="text-sm text-gray-600">연체된 복습</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {upcomingCount}
              </div>
              <div className="text-sm text-gray-600">곧 예정된 복습</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>마지막 확인: {formatLastChecked()}</span>
            <div className="flex items-center gap-2">
              {isInQuietHours() && (
                <Badge variant="secondary" size="sm">조용한 시간</Badge>
              )}
              <Button
                onClick={refresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                새로고침
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 기본 알림 설정 */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">기본 알림 설정</h3>
        
        <div className="space-y-4">
          {/* 전체 알림 활성화 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">알림 받기</div>
              <div className="text-sm text-gray-600">
                SRS 복습 관련 모든 알림을 받습니다
              </div>
            </div>
            <Checkbox
              checked={isNotificationEnabled()}
              onChange={toggleNotifications}
              disabled={isSaving}
            />
          </div>

          {/* 연체 알림 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">연체 알림</div>
              <div className="text-sm text-gray-600">
                복습 기한이 지났을 때 알림을 받습니다
              </div>
            </div>
            <Checkbox
              checked={settings?.overdueEnabled || false}
              onChange={toggleOverdueNotifications}
              disabled={isSaving || !isNotificationEnabled()}
            />
          </div>

          {/* 리마인더 알림 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">리마인더 알림</div>
              <div className="text-sm text-gray-600">
                복습 시간이 다가올 때 미리 알림을 받습니다
              </div>
            </div>
            <Checkbox
              checked={settings?.reminderEnabled || false}
              onChange={toggleReminderNotifications}
              disabled={isSaving || !isNotificationEnabled()}
            />
          </div>
        </div>
      </Card>

      {/* 알림 타이밍 설정 */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">알림 타이밍</h3>
        
        <div className="space-y-4">
          {/* 연체 알림 지연 */}
          <div>
            <label className="block font-medium mb-2">연체 알림 지연</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempSettings.overdueDelayMinutes}
                onChange={(e) => setTempSettings(prev => ({
                  ...prev,
                  overdueDelayMinutes: parseInt(e.target.value) || 0
                }))}
                disabled={isSaving || !settings?.overdueEnabled}
                min={0}
                max={1440}
                className="w-24"
              />
              <span className="text-sm text-gray-600">분 후에 알림</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              복습 기한이 지난 후 얼마나 기다렸다가 알림을 보낼지 설정합니다
            </div>
          </div>

          {/* 리마인더 사전 알림 */}
          <div>
            <label className="block font-medium mb-2">리마인더 사전 알림</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempSettings.reminderAdvanceMinutes}
                onChange={(e) => setTempSettings(prev => ({
                  ...prev,
                  reminderAdvanceMinutes: parseInt(e.target.value) || 0
                }))}
                disabled={isSaving || !settings?.reminderEnabled}
                min={0}
                max={1440}
                className="w-24"
              />
              <span className="text-sm text-gray-600">분 전에 알림</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              복습 시간 전에 얼마나 미리 알림을 받을지 설정합니다
            </div>
          </div>
        </div>
      </Card>

      {/* 조용한 시간 설정 */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">조용한 시간</h3>
        
        <div className="space-y-4">
          {/* 조용한 시간 활성화 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">조용한 시간 사용</div>
              <div className="text-sm text-gray-600">
                설정한 시간대에는 알림을 받지 않습니다
              </div>
            </div>
            <Checkbox
              checked={tempSettings.quietEnabled}
              onChange={(checked) => setTempSettings(prev => ({
                ...prev,
                quietEnabled: checked
              }))}
              disabled={isSaving || !isNotificationEnabled()}
            />
          </div>

          {/* 시간 설정 */}
          {tempSettings.quietEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">시작 시간</label>
                <Input
                  type="time"
                  value={tempSettings.quietStart}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    quietStart: e.target.value
                  }))}
                  disabled={isSaving}
                />
              </div>
              
              <div>
                <label className="block font-medium mb-2">종료 시간</label>
                <Input
                  type="time"
                  value={tempSettings.quietEnd}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    quietEnd: e.target.value
                  }))}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 설정 저장 및 테스트 */}
      <Card>
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Button
              onClick={handleSaveAllSettings}
              disabled={isSaving}
              variant="primary"
            >
              {isSaving ? '저장 중...' : '설정 저장'}
            </Button>
            
            {/* 연체 알림 테스트 (개발용) */}
            {process.env.NODE_ENV === 'development' && overdueCount > 0 && (
              <Button
                onClick={triggerOverdueNotification}
                disabled={isSaving}
                variant="outline"
              >
                연체 알림 테스트
              </Button>
            )}
          </div>

          {/* 오류 메시지 */}
          {(state.error || state.saveError) && (
            <div className="text-sm text-red-600">
              {state.error || state.saveError}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;