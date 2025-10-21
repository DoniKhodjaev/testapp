'use client';

import { useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    action: '',
    userId: '',
    objectType: '',
    result: '',
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.action) params.action = filters.action;
      if (filters.userId) params.userId = filters.userId;
      if (filters.objectType) params.objectType = filters.objectType;
      if (filters.result) params.result = filters.result;

      const { data } = await auditApi.getAll(params);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      from: '',
      to: '',
      action: '',
      userId: '',
      objectType: '',
      result: '',
    });
    setTimeout(() => loadLogs(), 0);
  };

  const handleExportCSV = () => {
    const headers = [
      'Дата/Время',
      'Действие',
      'Объект',
      'ID объекта',
      'Пользователь',
      'Результат',
      'IP',
      'User Agent',
      'Ошибка',
    ];

    const rows = logs.map((log: any) => [
      formatDateTime(log.createdAt),
      log.action,
      log.objectType || '-',
      log.objectId || '-',
      log.userId || '-',
      log.result || '-',
      log.ip || '-',
      log.userAgent || '-',
      log.errorMsg || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionBadge = (action: string) => {
    const colors: any = {
      LOGIN: 'bg-blue-100 text-blue-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
      CREATE_PAYMENT: 'bg-green-100 text-green-700',
      UPDATE_PAYMENT: 'bg-yellow-100 text-yellow-700',
      DELETE_PAYMENT: 'bg-red-100 text-red-700',
      SIGN_PAYMENT: 'bg-purple-100 text-purple-700',
      SEND_PAYMENT: 'bg-indigo-100 text-indigo-700',
      CREATE_USER: 'bg-green-100 text-green-700',
      UPDATE_USER: 'bg-yellow-100 text-yellow-700',
      ENABLE_2FA: 'bg-green-100 text-green-700',
      DISABLE_2FA: 'bg-orange-100 text-orange-700',
      RESET_2FA: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-700'}`}>
        {action}
      </span>
    );
  };

  const getResultBadge = (result: string) => {
    const colors: any = {
      SUCCESS: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      ERROR: 'bg-red-100 text-red-700',
    };
    return result ? (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[result] || 'bg-gray-100 text-gray-700'}`}>
        {result}
      </span>
    ) : (
      '-'
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Загрузка логов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Журнал аудита</h2>
        <button onClick={handleExportCSV} className="btn btn-secondary" disabled={logs.length === 0}>
          Экспорт CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="font-semibold mb-4">Фильтры</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">С даты</label>
            <input
              type="date"
              className="input"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">По дату</label>
            <input
              type="date"
              className="input"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Действие</label>
            <select className="input" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
              <option value="">Все</option>
              <option value="LOGIN">Вход</option>
              <option value="LOGOUT">Выход</option>
              <option value="CREATE_PAYMENT">Создание платежа</option>
              <option value="UPDATE_PAYMENT">Изменение платежа</option>
              <option value="DELETE_PAYMENT">Удаление платежа</option>
              <option value="SIGN_PAYMENT">Подпись платежа</option>
              <option value="SEND_PAYMENT">Отправка платежа</option>
              <option value="CREATE_USER">Создание пользователя</option>
              <option value="UPDATE_USER">Изменение пользователя</option>
              <option value="ENABLE_2FA">Включение 2FA</option>
              <option value="DISABLE_2FA">Отключение 2FA</option>
              <option value="RESET_2FA">Сброс 2FA</option>
            </select>
          </div>
          <div>
            <label className="label">Тип объекта</label>
            <select
              className="input"
              value={filters.objectType}
              onChange={(e) => setFilters({ ...filters, objectType: e.target.value })}
            >
              <option value="">Все</option>
              <option value="Payment">Платеж</option>
              <option value="User">Пользователь</option>
              <option value="Account">Счет</option>
              <option value="Message">Сообщение</option>
            </select>
          </div>
          <div>
            <label className="label">Результат</label>
            <select className="input" value={filters.result} onChange={(e) => setFilters({ ...filters, result: e.target.value })}>
              <option value="">Все</option>
              <option value="SUCCESS">Успех</option>
              <option value="FAILED">Ошибка</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleApplyFilters} className="btn btn-primary flex-1">
              Применить
            </button>
            <button onClick={handleClearFilters} className="btn btn-secondary flex-1">
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Дата/Время</th>
                <th className="text-left py-3 px-4">Действие</th>
                <th className="text-left py-3 px-4">Объект</th>
                <th className="text-left py-3 px-4">Результат</th>
                <th className="text-left py-3 px-4">IP</th>
                <th className="text-center py-3 px-4">Детали</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Логи не найдены
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <>
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{formatDateTime(log.createdAt)}</td>
                      <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3 px-4 text-sm">
                        {log.objectType ? (
                          <div>
                            <div className="font-medium">{log.objectType}</div>
                            {log.objectId && <div className="text-xs text-gray-500">{log.objectId.substring(0, 8)}...</div>}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">{getResultBadge(log.result)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.ip || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          {expandedLog === log.id ? 'Свернуть' : 'Показать'}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="py-4 px-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-semibold text-gray-600">ID лога:</span>
                                <p className="text-sm mt-1 font-mono">{log.id}</p>
                              </div>
                              {log.userId && (
                                <div>
                                  <span className="text-sm font-semibold text-gray-600">ID пользователя:</span>
                                  <p className="text-sm mt-1 font-mono">{log.userId}</p>
                                </div>
                              )}
                              {log.userAgent && (
                                <div className="col-span-2">
                                  <span className="text-sm font-semibold text-gray-600">User Agent:</span>
                                  <p className="text-sm mt-1 text-gray-700">{log.userAgent}</p>
                                </div>
                              )}
                              {log.errorMsg && (
                                <div className="col-span-2">
                                  <span className="text-sm font-semibold text-red-600">Ошибка:</span>
                                  <p className="text-sm mt-1 text-red-700">{log.errorMsg}</p>
                                </div>
                              )}
                            </div>
                            {(log.beforeJson || log.afterJson) && (
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                {log.beforeJson && (
                                  <div>
                                    <span className="text-sm font-semibold text-gray-600">До:</span>
                                    <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-40">
                                      {JSON.stringify(log.beforeJson, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.afterJson && (
                                  <div>
                                    <span className="text-sm font-semibold text-gray-600">После:</span>
                                    <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-40">
                                      {JSON.stringify(log.afterJson, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logs.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">Показано: {logs.length} записей</div>
        )}
      </div>
    </div>
  );
}
