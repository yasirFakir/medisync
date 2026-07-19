import React from 'react';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'blue', icon }) => (
  <span className={`badge badge-${variant}`}>
    {icon}
    {children}
  </span>
);
