import React from 'react';

const ProgressBar = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const baseClasses = 'w-full bg-border rounded-full overflow-hidden';

  return (
    <div className={`${baseClasses} ${sizes[size]} ${className}`} {...props}>
      <div
        className={`${colors[color]} h-full transition-all duration-300 ease-in-out`}
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <div className="text-xs text-muted mt-1 text-center">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;