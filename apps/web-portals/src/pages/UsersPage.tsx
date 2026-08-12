import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Input, Spinner, EmptyState, Modal } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Search, Users, UserCheck, Shield, Trash2, Edit3, Mail, Phone, Calendar, CheckCircle2, RefreshCw, UserPlus
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';
  createdAt: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit Role Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN'>('PATIENT');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Endpoint can fall back to /users if /admin/users fails
      const endpoint = '/admin/users';
      const params: Record<string, any> = {
        search: query.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
      };

      const res = await apiClient.get(endpoint, { params }).catch(() => {
        return apiClient.get('/users', { params });
      });

      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load users directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, roleFilter]);

  const handleOpenRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setUpdatingId(selectedUser.id);
    try {
      await apiClient.patch(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to update user role:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user profile? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`).catch(() => apiClient.delete(`/users/${userId}`));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'purple';
      case 'DOCTOR': return 'green';
      case 'PHARMACY': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#00685f] to-[#004d46] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/80 mb-1 flex items-center gap-1.5">
            <Users size={14} /> System Identity & Governance
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            User Accounts Directory
          </h1>
          <p className="text-xs text-white/90 mt-1 max-w-xl">
            Manage user security roles, search registered patients, doctors, and pharmacy accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Total Accounts</div>
            <div className="text-xl font-black text-[#FEF08A]">{users.length} Users</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/20 outline-none transition-all"
            placeholder="Search by full name, email, or phone number..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-[#00685f] text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}

          <button
            onClick={fetchUsers}
            className="p-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface rounded-lg"
            title="Refresh List"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── User List Grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No Users Found"
          description="No registered user accounts match your search or role filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#00685f]/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00685f]/10 text-[#00685f] font-black text-sm flex items-center justify-center">
                      {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">{user.fullName}</h3>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <Mail size={12} /> {user.email}
                      </div>
                    </div>
                  </div>

                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </div>

                {user.phoneNumber && (
                  <div className="text-xs text-on-surface-variant flex items-center gap-1.5 bg-surface-container-low px-3 py-2 rounded-xl">
                    <Phone size={13} className="text-[#00685f]" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <Calendar size={12} /> {new Date(user.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRoleModal(user)}
                    className="bg-[#00685f]/10 text-[#00685f] hover:bg-[#00685f]/20 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Edit3 size={13} /> Change Role
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs p-1.5 rounded-lg transition-all"
                    title="Delete Account"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Change User Role ───────────────────────────────────────────── */}
      {isModalOpen && selectedUser && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Change User Security Role"
          size="sm"
        >
          <div className="space-y-4">
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-1">
              <div className="font-bold text-sm text-on-surface">{selectedUser.fullName}</div>
              <div className="text-xs text-on-surface-variant">{selectedUser.email}</div>
              <div className="text-xs font-semibold text-[#00685f] mt-1">Current Role: {selectedUser.role}</div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">Select New Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface font-semibold outline-none focus:border-[#00685f]"
              >
                <option value="PATIENT">PATIENT (Standard User)</option>
                <option value="DOCTOR">DOCTOR (Clinical Medical Staff)</option>
                <option value="PHARMACY">PHARMACY (Inventory & Sales Partner)</option>
                <option value="ADMIN">ADMIN (System Oversight & Governance)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-1/2 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === selectedUser.id}
                onClick={handleUpdateRole}
                className="w-1/2 py-2.5 bg-[#00685f] text-white rounded-xl text-xs font-bold hover:bg-[#00524b] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {updatingId === selectedUser.id ? <Spinner size={14} /> : 'Save New Role'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
