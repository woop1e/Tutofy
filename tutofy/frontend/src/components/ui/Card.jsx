import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  ...props
}) => {
  const baseClasses = 'bg-white rounded-card border border-border';

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    cta: 'shadow-cta',
  };

  const classes = `${baseClasses} ${paddings[padding]} ${shadows[shadow]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;