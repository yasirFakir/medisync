import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = 'var(--color-brand-400)' }) => (
  <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
        {trend.value >= 0
          ? <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
          : <TrendingDown size={14} style={{ color: 'var(--color-danger)' }} />}
        <span style={{ color: trend.value >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
          {Math.abs(trend.value)}%
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
      </div>
    )}
  </div>
);
