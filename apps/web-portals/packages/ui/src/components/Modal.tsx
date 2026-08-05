import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const maxW = size === 'sm' ? '400px' : size === 'lg' ? '720px' : size === 'xl' ? '1100px' : size === 'full' ? '96vw' : '560px';
  const maxH = (size === 'xl' || size === 'full') ? '92vh' : 'auto';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      padding: '16px',
    }} onClick={onClose}>
      <div className="glass-elevated animate-fade-in" style={{ width: '100%', maxWidth: maxW, maxHeight: maxH, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};
