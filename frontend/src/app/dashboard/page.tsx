'use client';

import { useEffect, useState } from 'react';
import { accountsApi, paymentsApi, messagesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsRes, paymentsRes, messagesRes] = await Promise.all([
        accountsApi.getAll(),
        paymentsApi.getAll({ take: 5 }),
        messagesApi.getAll({ unread: true }),
      ]);

      setAccounts(accountsRes.data);
      setRecentPayments(paymentsRes.data.items);
      setUnreadMessages(messagesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h2 className="text-2xl font-bold mb-6">Главная</h2>
      </div>

      {/* Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: any) => (
          <div key={account.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600">Расчетный счет</p>
                <p className="font-mono text-sm">{account.accountNo}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  account.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {account.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{account.bankName}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Последние платежи</p>
          <p className="text-3xl font-bold">{recentPayments.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Непрочитанные сообщения</p>
          <p className="text-3xl font-bold text-orange-600">
            {unreadMessages.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Активных счетов</p>
          <p className="text-3xl font-bold text-green-600">
            {accounts.filter((a: any) => a.isActive).length}
          </p>
        </div>
      </div>

      {/* Recent payments */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Последние платежи</h3>
        {recentPayments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет платежей</p>
        ) : (
          <div className="space-y-3">
            {recentPayments.map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{payment.receiverName}</p>
                  <p className="text-sm text-gray-600">{payment.purpose}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      payment.status === 'POSTED'
                        ? 'bg-green-100 text-green-700'
                        : payment.status === 'DRAFT'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unread messages */}
      {unreadMessages.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Непрочитанные сообщения</h3>
          <div className="space-y-3">
            {unreadMessages.slice(0, 3).map((message: any) => (
              <div
                key={message.id}
                className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500"
              >
                <p className="font-medium">{message.subject}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {message.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
