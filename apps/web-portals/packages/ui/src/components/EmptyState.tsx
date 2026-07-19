import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center' }}>
    <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{description}</p>}
    </div>
    {action}
  </div>
);
