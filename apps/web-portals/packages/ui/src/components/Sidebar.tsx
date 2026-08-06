import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Upload } from 'lucide-react';
import { Avatar } from './Avatar';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  user: { fullName: string; email: string; role: string } | null;
  onLogout: () => void;
  logo?: React.ReactNode;
  accentColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <aside className="w-[280px] h-screen sticky top-0 bg-white border-r border-[#bcc9c6]/30 flex flex-col justify-between py-6 px-4 flex-shrink-0 z-20 font-sans shadow-[0px_4px_20px_rgba(30,41,59,0.05)]">
      {/* Top Header & Brand */}
      <div>
        <div className="px-3 mb-6">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#00685f] text-[32px]">health_and_safety</span>
            <div>
              <h1 className="text-[20px] font-bold text-[#00685f] leading-tight">MediSync</h1>
              <p className="text-[12px] font-semibold text-[#3d4947]">Health-Tech Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-[14px] font-semibold transition-all ${
                  isActive
                    ? 'border-l-4 border-[#00685f] text-[#00685f] bg-[#f0f3ff] font-bold translate-x-0.5'
                    : 'border-l-4 border-transparent text-[#3d4947] hover:bg-[#f0f3ff] hover:text-[#111c2d]'
                }`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="pt-4 border-t border-[#bcc9c6]/30">

        {user && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3 min-w-0">
              <Avatar name={user.fullName} size={36} />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#111c2d] truncate">{user.fullName}</p>
                <p className="text-[11px] font-semibold text-[#3d4947] capitalize truncate">{user.role.toLowerCase()} Profile</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
