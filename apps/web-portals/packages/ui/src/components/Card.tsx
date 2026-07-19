import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = false, style, onClick }) => (
  <div className={`${glass ? 'glass-elevated' : 'card'} ${className}`} style={{ ...style, cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
    {children}
  </div>
);
