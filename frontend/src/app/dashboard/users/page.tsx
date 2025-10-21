'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: any = {
      ADMIN: 'bg-purple-100 text-purple-700',
      OPERATOR: 'bg-blue-100 text-blue-700',
      SIGNER: 'bg-green-100 text-green-700',
      VIEWER: 'bg-gray-100 text-gray-700',
    };
    const labels: any = {
      ADMIN: 'Админ',
      OPERATOR: 'Оператор',
      SIGNER: 'Подписант',
      VIEWER: 'Наблюдатель',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (!confirm(`${isActive ? 'Деактивировать' : 'Активировать'} пользователя?`)) return;

    try {
      await usersApi.update(userId, { isActive: !isActive });
      await loadUsers();
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetMfa = async (userId: string) => {
    if (!confirm('Сбросить 2FA для пользователя?')) return;

    try {
      await usersApi.resetMfa(userId);
      await loadUsers();
      alert('2FA успешно сброшен');
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Пользователи</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + Добавить пользователя
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Телефон</th>
                <th className="text-center py-3 px-4">Роль</th>
                <th className="text-center py-3 px-4">2FA</th>
                <th className="text-center py-3 px-4">Статус</th>
                <th className="text-center py-3 px-4">Последний вход</th>
                <th className="text-center py-3 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.email}</td>
                  <td className="py-3 px-4">{user.phone || '-'}</td>
                  <td className="py-3 px-4 text-center">{getRoleBadge(user.role)}</td>
                  <td className="py-3 px-4 text-center">
                    {user.mfaEnabled ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.isActive
                          ? user.isBlocked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.isBlocked ? 'Заблокирован' : user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Никогда'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        {user.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      {user.mfaEnabled && (
                        <button
                          onClick={() => handleResetMfa(user.id)}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          Сбросить 2FA
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'OPERATOR',
    permissions: user?.permissions || [],
  });
  const [loading, setLoading] = useState(false);

  const allPermissions = [
    { key: 'payments:create', label: 'Создание платежей' },
    { key: 'payments:edit', label: 'Редактирование платежей' },
    { key: 'payments:view', label: 'Просмотр платежей' },
    { key: 'payments:delete', label: 'Удаление платежей' },
    { key: 'payments:sign', label: 'Подписание платежей' },
    { key: 'payments:send', label: 'Отправка платежей' },
    { key: 'payments:import', label: 'Импорт платежей' },
    { key: 'payments:export', label: 'Экспорт платежей' },
    { key: 'statements:view', label: 'Просмотр выписок' },
    { key: 'statements:export', label: 'Экспорт выписок' },
    { key: 'vkdocs:upload', label: 'Загрузка ВК документов' },
    { key: 'vkdocs:view', label: 'Просмотр ВК документов' },
    { key: 'messages:view', label: 'Просмотр сообщений' },
    { key: 'messages:reply', label: 'Ответы на сообщения' },
    { key: 'users:manage', label: 'Управление пользователями' },
    { key: 'audit:view', label: 'Просмотр аудита' },
    { key: 'audit:export', label: 'Экспорт аудита' },
  ];

  const rolePresets: any = {
    ADMIN: allPermissions.map((p) => p.key),
    OPERATOR: [
      'payments:create',
      'payments:edit',
      'payments:view',
      'payments:import',
      'payments:export',
      'statements:view',
      'vkdocs:upload',
      'vkdocs:view',
      'messages:view',
      'messages:reply',
    ],
    SIGNER: ['payments:view', 'payments:sign', 'payments:send', 'statements:view', 'messages:view'],
    VIEWER: ['payments:view', 'statements:view', 'messages:view'],
  };

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role,
      permissions: rolePresets[role] || [],
    });
  };

  const togglePermission = (permission: string) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p: string) => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update
        await usersApi.update(user.id, {
          role: formData.role,
          permissions: formData.permissions,
        });
      } else {
        // Create
        if (!formData.password) {
          alert('Укажите пароль');
          setLoading(false);
          return;
        }
        await usersApi.create(formData);
      }
      onSuccess();
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {user ? 'Редактировать пользователя' : 'Создать пользователя'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Телефон</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+79991234567"
                />
              </div>

              <div>
                <label className="label">Пароль *</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Минимум 8 символов</p>
              </div>
            </>
          )}

          <div>
            <label className="label">Роль *</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="ADMIN">Админ</option>
              <option value="OPERATOR">Оператор</option>
              <option value="SIGNER">Подписант</option>
              <option value="VIEWER">Наблюдатель</option>
            </select>
          </div>

          <div>
            <label className="label">Права доступа</label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="rounded"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Выбрано: {formData.permissions.length} из {allPermissions.length}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Сохранение...' : user ? 'Сохранить' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
