import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { generateBreadcrumb } from '../../config/navigation';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const breadcrumbItems = generateBreadcrumb(location.pathname);

  if (breadcrumbItems.length <= 1) {
    return null; // 홈페이지에서는 브레드크럼 숨김
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <span className="text-text-muted select-none">/</span>
          )}
          {index === breadcrumbItems.length - 1 ? (
            // 현재 페이지는 링크 없이 표시
            <span className="text-text-primary font-medium">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-text-primary transition-colors duration-200"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};