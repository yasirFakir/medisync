import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { Avatar } from './Avatar';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  user?: { fullName: string; role: string } | null;
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, actions, onSearch }) => (
  <header className="flex justify-between items-center w-full px-10 h-16 bg-[#f9f9ff] border-b border-[#bcc9c6]/30 sticky top-0 z-10 font-sans">
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

    {/* Right: Notifications, Settings, Profile */}
    <div className="flex items-center gap-4">
      {actions}
      <button className="text-[#3d4947] hover:text-[#00685f] transition-all relative cursor-pointer p-1.5 rounded-full hover:bg-gray-100">
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
      </button>

      <button className="text-[#3d4947] hover:text-[#00685f] transition-all cursor-pointer p-1.5 rounded-full hover:bg-gray-100">
        <span className="material-symbols-outlined text-[24px]">settings</span>
      </button>

      {user && (
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#bcc9c6]/30 ml-2">
          <Avatar name={user.fullName} size={32} />
        </div>
      )}
    </div>
  </header>
);
