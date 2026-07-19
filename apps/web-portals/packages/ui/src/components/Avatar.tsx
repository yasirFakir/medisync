import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  src?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, src }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const colors = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}22`, border: `2px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};
