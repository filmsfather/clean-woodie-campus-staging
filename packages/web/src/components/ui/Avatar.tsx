import React from 'react';

export interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className = '', children }) => {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
      {children}
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