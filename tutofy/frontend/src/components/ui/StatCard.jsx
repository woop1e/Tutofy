import React from 'react';
import Card from './Card';

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  className = '',
  ...props
}) => {
  return (
    <Card className={`text-center ${className}`} {...props}>
      <div className="flex items-center justify-center mb-2">
        {icon && <div className="text-primary mr-2">{icon}</div>}
        <h3 className="text-muted text-sm font-medium">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-dark mb-1">{value}</div>
      {trend && trendValue && (
        <div className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </Card>
  );
};

export default StatCard;