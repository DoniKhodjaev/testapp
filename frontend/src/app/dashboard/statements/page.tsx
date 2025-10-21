'use client';

import { useEffect, useState } from 'react';
import { statementsApi, accountsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function StatementsPage() {
  const [statements, setStatements] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statementsRes, accountsRes] = await Promise.all([
        statementsApi.getAll(),
        accountsApi.getAll(),
      ]);
      setStatements(statementsRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const { data } = await statementsApi.generate(formData);
      alert(`Выписка создана успешно. Транзакций: ${data.meta.transactionCount}`);
      setShowGenerateModal(false);
      setFormData({ accountId: '', dateFrom: '', dateTo: '' });
      loadData();
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (statementId: string, format: 'pdf' | 'xlsx') => {
    try {
      const response = format === 'pdf'
        ? await statementsApi.exportPDF(statementId)
        : await statementsApi.exportXLSX(statementId);

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `statement_${statementId}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error: any) {
      alert('Ошибка при скачивании: ' + (error.response?.data?.message || error.message));
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
        <h2 className="text-2xl font-bold">Выписки</h2>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn btn-primary"
        >
          + Сформировать выписку
        </button>
      </div>

      {/* Statements Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Счет</th>
                <th className="text-left py-3 px-4">Период</th>
                <th className="text-right py-3 px-4">Входящий остаток</th>
                <th className="text-right py-3 px-4">Исходящий остаток</th>
                <th className="text-center py-3 px-4">Операций</th>
                <th className="text-left py-3 px-4">Создано</th>
                <th className="text-center py-3 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {statements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Выписок пока нет. Создайте первую выписку.
                  </td>
                </tr>
              ) : (
                statements.map((statement: any) => (
                  <tr key={statement.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{statement.account.accountNo}</div>
                      <div className="text-xs text-gray-500">{statement.account.currency}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {new Date(statement.dateFrom).toLocaleDateString('ru-RU')} -{' '}
                        {new Date(statement.dateTo).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {statement.metaJson?.openingBalance?.toLocaleString('ru-RU') || '0'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {statement.metaJson?.closingBalance?.toLocaleString('ru-RU') || '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {statement.metaJson?.transactionCount || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateTime(statement.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDownload(statement.id, 'pdf')}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleDownload(statement.id, 'xlsx')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          XLSX
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-xl font-bold mb-4">Сформировать выписку</h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="label">Счет *</label>
                <select
                  className="input"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  required
                >
                  <option value="">Выберите счет</option>
                  {accounts.map((account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNo} ({account.currency}) - {Number(account.balance).toLocaleString('ru-RU')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Дата начала *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.dateFrom}
                  onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Дата окончания *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.dateTo}
                  onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={generating}
                >
                  {generating ? 'Формируется...' : 'Сформировать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={generating}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
