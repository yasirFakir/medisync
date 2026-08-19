import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  user?: { fullName: string; role: string; avatarUrl?: string | null } | null;
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  notificationBell?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ user, actions, onSearch, notificationBell }) => (
  <header className="flex justify-between items-center w-full px-6 lg:px-12 h-16 bg-[#f9f9ff] border-b border-[#bcc9c6]/30 sticky top-0 z-10 font-sans">
    {/* Left: Mobile Title or Search bar */}
    <div className="flex items-center gap-4">
      <div className="relative hidden sm:block">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a77] text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Search medicines, prescriptions..."
          onChange={e => onSearch?.(e.target.value)}
          className="pl-10 pr-4 py-2 bg-white border border-[#bcc9c6] rounded-full text-sm text-[#111c2d] focus:outline-none focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] w-64 lg:w-96 transition-colors"
        />
      </div>
    </div>

    {/* Right: Notifications, Profile */}
    <div className="flex items-center gap-3 pr-2">
      {actions}
      {notificationBell}

      {user && (
        <Link
          to="/profile"
          className="w-9 h-9 rounded-full overflow-hidden border border-[#bcc9c6]/40 hover:ring-2 hover:ring-[#00685f]/50 transition-all flex items-center justify-center ml-1"
          title={`${user.fullName} (${user.role}) - View Profile`}
        >
          <Avatar name={user.fullName} size={36} src={user.avatarUrl || undefined} />
        </Link>
      )}
    </div>
  </header>
);
