import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';

export const WelcomeSection: React.FC = () => {
  const { user } = useAuth();
  const currentHour = new Date().getHours();
  const greeting = 
    currentHour < 12 ? '좋은 아침' : 
    currentHour < 18 ? '좋은 오후' : 
    '좋은 저녁';
  
  const getMotivationalMessage = () => {
    const messages = [
      '오늘도 열심히 공부해봐요! 💪',
      '새로운 것을 배우는 하루가 되세요! ✨',
      '꾸준함이 가장 큰 힘이에요! 🌟',
      '오늘의 목표를 달성해봐요! 🎯',
      '차근차근 하나씩 해나가요! 📚'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!user) {
    return null;
  }

  return (
    <div className="text-center space-y-4 py-6">
      {/* 아바타 */}
      <div className="flex justify-center">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-16 h-16 rounded-full border-2 border-primary-200"
          />
        ) : (
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 text-xl font-semibold">
              {user.displayName?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>
      
      {/* 인사말 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}이에요, {user.displayName}님! 👋
        </h1>
        <p className="text-text-secondary">
          {user.gradeLevel && `${user.gradeLevel}학년 `}
          {getMotivationalMessage()}
        </p>
        <div className="text-xs text-text-tertiary">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>
    </div>
  );
};