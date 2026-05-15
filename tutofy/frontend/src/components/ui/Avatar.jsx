import React from 'react';

const Avatar = ({
  src,
  alt = '',
  size = 'md',
  initials,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const baseClasses = `${sizes[size]} rounded-full bg-muted flex items-center justify-center font-medium text-body overflow-hidden`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseClasses} object-cover ${className}`}
        {...props}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {initials || alt.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar;