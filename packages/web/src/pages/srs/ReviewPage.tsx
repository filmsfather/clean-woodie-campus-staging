import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReviewSession } from '../../components/srs';
import { FeatureGuard } from '../../components/auth';

/**
 * SRS 복습 페이지
 * 
 * 사용자가 SRS 복습 세션을 진행하는 전용 페이지입니다.
 * 인증이 필요하며, 복습 완료 후 대시보드로 리디렉션됩니다.
 */
export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSessionComplete = (completedCount: number, totalCount: number) => {
    // 세션 완료 시 대시보드로 이동하면서 성과 전달
    navigate('/dashboard', {
      state: {
        reviewSessionComplete: true,
        completedReviews: completedCount,
        totalReviews: totalCount
      }
    });
  };

  const handleSessionExit = () => {
    // 세션 종료 시 대시보드로 돌아가기
    navigate('/dashboard');
  };

  return (
    <FeatureGuard feature="srs" fallback="/dashboard">
      <div className="review-page min-h-screen bg-gray-50">
        {/* 헤더 영역 */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                복습 시간
              </h1>
              <p className="text-gray-600">
                집중해서 복습을 진행해보세요. 키보드 단축키를 활용하면 더 빠르게 진행할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ReviewSession
            onSessionComplete={handleSessionComplete}
            onSessionExit={handleSessionExit}
            autoAdvance={true}
            showProgress={true}
            enableKeyboardShortcuts={true}
          />
        </div>
      </div>
    </FeatureGuard>
  );
};

ReviewPage.displayName = 'ReviewPage';

export default ReviewPage;