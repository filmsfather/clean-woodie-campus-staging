import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome Section */}
      <div className="text-center space-y-3">
        <div className="h-8 bg-surface-secondary rounded-lg w-64 mx-auto"></div>
        <div className="h-4 bg-surface-secondary rounded-lg w-48 mx-auto"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-secondary rounded-lg p-6">
            <div className="space-y-3">
              <div className="h-8 bg-surface-tertiary rounded w-16 mx-auto"></div>
              <div className="h-4 bg-surface-tertiary rounded w-20 mx-auto"></div>
              <div className="h-3 bg-surface-tertiary rounded w-24 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-surface-secondary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-surface-tertiary rounded w-24"></div>
          <div className="h-5 bg-surface-tertiary rounded w-16"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-tertiary rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-secondary rounded-lg p-6">
          <div className="h-6 bg-surface-tertiary rounded w-32 mb-4"></div>
          <div className="h-32 bg-surface-tertiary rounded-lg"></div>
        </div>
        <div className="bg-surface-secondary rounded-lg p-6">
          <div className="h-6 bg-surface-tertiary rounded w-28 mb-4"></div>
          <div className="h-32 bg-surface-tertiary rounded-lg"></div>
        </div>
      </div>

      {/* Large Content Block */}
      <div className="bg-surface-secondary rounded-lg p-6">
        <div className="h-6 bg-surface-tertiary rounded w-36 mb-4"></div>
        <div className="h-64 bg-surface-tertiary rounded-lg"></div>
      </div>
    </div>
  );
};