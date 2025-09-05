import React, { useState, useCallback } from 'react';
import { DashboardWidget, getDashboardWidgets } from './DashboardLayout';
import { UserRole } from '../../../types/auth';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Checkbox } from '../../ui/Checkbox';

// 대시보드 사용자 설정 인터페이스
export interface DashboardUserSettings {
  userId: string;
  role: UserRole;
  enabledWidgets: string[];
  widgetOrder: string[];
  customGridSpans?: Record<string, {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  }>;
  autoRefresh: boolean;
  compactMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  lastModified: Date;
}

// 기본 설정
export const getDefaultDashboardSettings = (role: UserRole, userId: string): DashboardUserSettings => {
  const availableWidgets = getDashboardWidgets(role);
  const enabledWidgets = availableWidgets
    .filter(w => w.isEnabled)
    .map(w => w.id);

  return {
    userId,
    role,
    enabledWidgets,
    widgetOrder: enabledWidgets,
    autoRefresh: true,
    compactMode: false,
    theme: 'auto',
    lastModified: new Date(),
  };
};

// 대시보드 설정 모달 Props
interface DashboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: DashboardUserSettings;
  onSave: (settings: DashboardUserSettings) => void;
  role: UserRole;
}

export const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  role,
}) => {
  const [localSettings, setLocalSettings] = useState<DashboardUserSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'widgets' | 'layout' | 'preferences'>('widgets');

  const availableWidgets = getDashboardWidgets(role);

  // 위젯 활성화/비활성화
  const toggleWidget = useCallback((widgetId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      enabledWidgets: prev.enabledWidgets.includes(widgetId)
        ? prev.enabledWidgets.filter(id => id !== widgetId)
        : [...prev.enabledWidgets, widgetId],
      lastModified: new Date(),
    }));
  }, []);

  // 위젯 순서 변경
  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    setLocalSettings(prev => {
      const currentOrder = [...prev.widgetOrder];
      const currentIndex = currentOrder.indexOf(widgetId);
      
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(currentOrder.length - 1, currentIndex + 1);
      
      // 배열 요소 교체
      [currentOrder[currentIndex], currentOrder[newIndex]] = [currentOrder[newIndex], currentOrder[currentIndex]];
      
      return {
        ...prev,
        widgetOrder: currentOrder,
        lastModified: new Date(),
      };
    });
  }, []);

  // 설정 저장
  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  // 기본값으로 리셋
  const handleReset = () => {
    const defaultSettings = getDefaultDashboardSettings(role, currentSettings.userId);
    setLocalSettings(defaultSettings);
  };

  // 위젯 정보 가져오기
  const getWidgetInfo = (widgetId: string): DashboardWidget | undefined => {
    return availableWidgets.find(w => w.id === widgetId);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">대시보드 설정</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              기본값으로 리셋
            </Button>
            <Button onClick={handleSave}>
              저장하기
            </Button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'widgets', label: '위젯 관리' },
            { id: 'layout', label: '레이아웃' },
            { id: 'preferences', label: '기본 설정' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {/* 위젯 관리 탭 */}
          {activeTab === 'widgets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  사용 가능한 위젯
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  대시보드에 표시할 위젯을 선택하세요. 드래그하여 순서를 변경할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableWidgets.map((widget) => {
                  const isEnabled = localSettings.enabledWidgets.includes(widget.id);
                  const orderIndex = localSettings.widgetOrder.indexOf(widget.id);
                  
                  return (
                    <Card key={widget.id} className={`transition-all ${isEnabled ? 'ring-2 ring-blue-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={isEnabled}
                              onChange={() => toggleWidget(widget.id)}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-text-primary">
                                {widget.title}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" size="sm">
                                  {widget.gridSpan.lg}열 너비
                                </Badge>
                                {widget.refreshInterval && (
                                  <Badge variant="secondary" size="sm">
                                    {widget.refreshInterval}초 새로고침
                                  </Badge>
                                )}
                                <Badge 
                                  variant={widget.priority <= 2 ? 'default' : 'secondary'} 
                                  size="sm"
                                >
                                  우선순위 {widget.priority}
                                </Badge>
                              </div>
                              {widget.requiresData && (
                                <div className="text-xs text-text-tertiary mt-1">
                                  필요 데이터: {widget.requiresData.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isEnabled && (
                            <div className="flex flex-col space-y-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveWidget(widget.id, 'up')}
                                disabled={orderIndex <= 0}
                                className="px-2 py-1"
                              >
                                ↑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveWidget(widget.id, 'down')}
                                disabled={orderIndex >= localSettings.widgetOrder.length - 1}
                                className="px-2 py-1"
                              >
                                ↓
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>선택된 위젯:</strong> {localSettings.enabledWidgets.length}개 / {availableWidgets.length}개
                </div>
              </div>
            </div>
          )}

          {/* 레이아웃 탭 */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  레이아웃 설정
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  대시보드의 전체적인 레이아웃을 조정합니다.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">컴팩트 모드</label>
                    <p className="text-xs text-text-secondary">위젯 간격을 줄여 더 많은 정보를 표시합니다</p>
                  </div>
                  <Checkbox
                    checked={localSettings.compactMode}
                    onChange={(event) => 
                      setLocalSettings(prev => ({
                        ...prev,
                        compactMode: event.target.checked,
                        lastModified: new Date(),
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-text-primary">반응형 미리보기</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['모바일', '태블릿', '데스크톱', '대형화면'].map((device, index) => (
                      <Card key={device}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{device}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="space-y-1">
                            {localSettings.enabledWidgets.slice(0, 3).map(widgetId => {
                              const widget = getWidgetInfo(widgetId);
                              if (!widget) return null;
                              
                              const spans = [
                                widget.gridSpan.xs,
                                widget.gridSpan.sm, 
                                widget.gridSpan.md,
                                widget.gridSpan.lg
                              ];
                              
                              return (
                                <div
                                  key={widgetId}
                                  className="h-4 bg-blue-200 rounded"
                                  style={{ width: `${(spans[index] / 12) * 100}%` }}
                                  title={widget.title}
                                />
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 기본 설정 탭 */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  기본 설정
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  대시보드 동작과 관련된 기본 설정을 변경합니다.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">자동 새로고침</label>
                    <p className="text-xs text-text-secondary">설정된 간격에 따라 위젯 데이터를 자동으로 새로고침합니다</p>
                  </div>
                  <Checkbox
                    checked={localSettings.autoRefresh}
                    onChange={(event) => 
                      setLocalSettings(prev => ({
                        ...prev,
                        autoRefresh: event.target.checked,
                        lastModified: new Date(),
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">테마</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: '라이트', icon: '☀️' },
                      { value: 'dark', label: '다크', icon: '🌙' },
                      { value: 'auto', label: '자동', icon: '🔄' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() =>
                          setLocalSettings(prev => ({
                            ...prev,
                            theme: theme.value as any,
                            lastModified: new Date(),
                          }))
                        }
                        className={`p-3 text-center rounded-lg border-2 transition-colors ${
                          localSettings.theme === theme.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{theme.icon}</div>
                        <div className="text-sm font-medium">{theme.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">설정 정보</h4>
                  <div className="text-sm text-text-secondary space-y-1">
                    <div>사용자 역할: <Badge variant="outline">{role}</Badge></div>
                    <div>활성 위젯: {localSettings.enabledWidgets.length}개</div>
                    <div>마지막 수정: {localSettings.lastModified.toLocaleString('ko-KR')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>
            설정 저장
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 대시보드 설정 컨텍스트
export const DashboardSettingsContext = React.createContext<{
  settings: DashboardUserSettings | null;
  updateSettings: (settings: Partial<DashboardUserSettings>) => void;
  resetSettings: () => void;
}>({
  settings: null,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useDashboardSettings = () => {
  const context = React.useContext(DashboardSettingsContext);
  if (!context) {
    throw new Error('useDashboardSettings must be used within a DashboardSettingsProvider');
  }
  return context;
};

export default DashboardSettingsModal;