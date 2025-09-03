import React, { ReactNode } from 'react';
import { useFeature } from '../../config/features';
import type { FeatureFlags } from '../../config/features';

interface FeatureGuardProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Feature Flag 기반 컴포넌트 가드
 * 기능이 비활성화된 경우 fallback UI 또는 null 렌더링
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback = null
}) => {
  const isEnabled = useFeature(feature);
  
  if (!isEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};