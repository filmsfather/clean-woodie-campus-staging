import React from 'react';

export interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
  src?: string;
  alt?: string;
  size?: string;
  initials?: string;
  hasAvatar?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  className = '', 
  children, 
  src, 
  alt = '', 
  size = '10',
  initials,
  hasAvatar = false
}) => {
  const sizeClass = size === '8' ? 'h-8 w-8' : size === '12' ? 'h-12 w-12' : 'h-10 w-10';
  
  return (
    <div className={`relative flex shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}>
      {hasAvatar && src ? (
        <AvatarImage src={src} alt={alt} />
      ) : initials ? (
        <AvatarFallback>{initials}</AvatarFallback>
      ) : (
        children
      )}
    </div>
  );
};

export interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ 
  src, 
  alt = '', 
  className = '' 
}) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`aspect-square h-full w-full ${className}`}
    />
  );
};

export interface AvatarFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700 ${className}`}>
      {children}
    </div>
  );
};