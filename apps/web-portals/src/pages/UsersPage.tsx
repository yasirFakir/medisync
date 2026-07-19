import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Input } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Search, Trash2 } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';
  createdAt: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', { params: { search: query } });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [query]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'purple';
      case 'DOCTOR': return 'green';
      case 'PHARMACY': return 'yellow';
      default: return 'blue';
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user profile?')) return;
    try {
      await apiClient.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Display Name', width: '30%' },
    { key: 'email', label: 'Email Coordinate', width: '30%' },
    {
      key: 'role',
      label: 'Security Role',
      render: (val: any) => <Badge variant={getRoleColor(val)}>{val}</Badge>
    },
    {
      key: 'id',
      label: 'Actions',
      render: (val: any) => (
        <Button size="sm" variant="ghost" onClick={() => handleDelete(val)} style={{ color: 'var(--color-danger)', padding: '6px' }}>
          <Trash2 size={16} />
        </Button>
      )
    }
  ];

  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>System User Accounts Directory</h3>
        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search accounts by name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={loading}
        keyExtractor={row => row.id}
      />
    </Card>
  );
};
