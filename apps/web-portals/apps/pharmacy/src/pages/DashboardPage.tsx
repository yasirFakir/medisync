import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard, Button } from '@medisync/ui';
import { Store, ClipboardEdit, AlertTriangle, BadgePercent } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Overview Banner */}
      <div style={{
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(139,92,246,0.05) 100%)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }} className="animate-fade-in">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            {user?.fullName || 'Partner Store'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px' }}>
            MediSync inventory sync dashboard. Update stock status and manage current drug pricing lists for patients.
          </p>
        </div>

        <Button onClick={() => navigate('/update-stock')} icon={<ClipboardEdit size={16} />}>
          Quick Stock Update
        </Button>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard label="Total Inventory SKUs" value="10 Items" icon={<Store size={20} />} trend={{ value: 0, label: 'synchronized' }} color="#f59e0b" />
        <StatCard label="Active Stock Ratio" value="100%" icon={<BadgePercent size={20} />} color="var(--color-brand-400)" />
        <StatCard label="Catalog Out of Stock" value="0 Items" icon={<AlertTriangle size={20} />} color="var(--color-danger)" />
      </div>

      {/* Shortcuts */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Inventory Shortcuts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <Card onClick={() => navigate('/inventory')} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Store size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Stock Catalogue</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Review prices and stock states</p>
            </div>
          </Card>

          <Card onClick={() => navigate('/update-stock')} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-400)' }}>
              <ClipboardEdit size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Update Stock Coordinates</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Modify current catalog status</p>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};
