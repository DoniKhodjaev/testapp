'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      const params: any = {};
      if (filter) params.status = filter;

      const { data } = await paymentsApi.getAll(params);
      setPayments(data.items);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-700',
      ON_APPROVAL: 'bg-yellow-100 text-yellow-700',
      SIGNED: 'bg-blue-100 text-blue-700',
      SENT: 'bg-purple-100 text-purple-700',
      BANK_ACCEPTED: 'bg-indigo-100 text-indigo-700',
      POSTED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };

    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const canCreate = user?.permissions?.includes('payments:create');

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
        <h2 className="text-2xl font-bold">Платежи</h2>
        {canCreate && (
          <Link href="/dashboard/payments/create" className="btn btn-primary">
            + Создать платеж
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg ${
              filter === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все
          </button>
          {['DRAFT', 'ON_APPROVAL', 'SIGNED', 'SENT', 'POSTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments list */}
      <div className="card">
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            Нет платежей
            {filter && ' с выбранным статусом'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Дата</th>
                  <th className="text-left py-3 px-4">Получатель</th>
                  <th className="text-left py-3 px-4">Назначение</th>
                  <th className="text-right py-3 px-4">Сумма</th>
                  <th className="text-center py-3 px-4">Статус</th>
                  <th className="text-center py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(payment.date)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{payment.receiverName}</p>
                        <p className="text-xs text-gray-500">
                          ИНН: {payment.receiverInn}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {payment.purpose}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <Link
                          href={`/dashboard/payments/${payment.id}`}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          Открыть
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
