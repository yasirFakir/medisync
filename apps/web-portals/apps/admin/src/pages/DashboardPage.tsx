import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard, Badge, Button, Spinner, apiClient } from '@medisync/ui';
import { Users, Pill, ShieldAlert, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'UP' | 'DOWN'>('DOWN');
  const [aiStatus, setAiStatus] = useState<'UP' | 'DOWN'>('DOWN');
  const [checking, setChecking] = useState(true);

  const checkSystemHealth = async () => {
    setChecking(true);
    try {
      const resBackend = await apiClient.get('/health');
      if (resBackend.data.success) setBackendStatus('UP');
    } catch {
      setBackendStatus('DOWN');
    }

    try {
      // Connect to FastAPI endpoint directly
      const resAi = await axios.get('http://localhost:8000/health');
      if (resAi.data.status === 'operational') setAiStatus('UP');
    } catch {
      setAiStatus('DOWN');
    }
    setChecking(false);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Overview Banner */}
      <div style={{
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(14,165,233,0.05) 100%)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }} className="animate-fade-in">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            System Core Console
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px' }}>
            Administrator workspace environment dashboard. Oversee global database configurations and track API cluster parameters.
          </p>
        </div>

        <Button variant="secondary" onClick={checkSystemHealth} disabled={checking}>
          {checking ? <Spinner size={14} /> : 'Refresh Health Checks'}
        </Button>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard label="Total Users registered" value="5 Accounts" icon={<Users size={20} />} trend={{ value: 10, label: 'since yesterday' }} color="#8b5cf6" />
        <StatCard label="Drug catalogue entries" value="10 Items" icon={<Pill size={20} />} color="var(--color-brand-400)" />
        <StatCard label="EHR Access Requests" value="3 Requests" icon={<ShieldAlert size={20} />} color="var(--color-accent-400)" />
      </div>

      {/* Cluster Health Diagnostics */}
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} style={{ color: '#8b5cf6' }} />
          Cluster Node Health Monitor
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Node API Gateway (Express Node.js)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Coordinates routes, authorization guards, and databases. Port 3001.</div>
            </div>
            <Badge variant={backendStatus === 'UP' ? 'green' : 'red'}>
              {backendStatus === 'UP' ? 'OPERATIONAL' : 'OFFLINE'}
            </Badge>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Node AI Triage Service (Python FastAPI)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Processes symptom OCR scanning models. Port 8000.</div>
            </div>
            <Badge variant={aiStatus === 'UP' ? 'green' : 'red'}>
              {aiStatus === 'UP' ? 'OPERATIONAL' : 'OFFLINE'}
            </Badge>
          </div>

        </div>
      </Card>
    </div>
  );
};
