'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi, accountsApi, counterpartiesApi } from '@/lib/api';
import { validateINN, validateBIC, validateAccount, formatINN, formatBIC, formatAccountNumber } from '@/lib/validators';

export default function CreatePaymentPage() {
  const router = useRouter();

  // Form state
  const [accounts, setAccounts] = useState([]);
  const [counterparties, setCounterparties] = useState([]);

  const [formData, setFormData] = useState({
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'RUB',
    receiverName: '',
    receiverInn: '',
    receiverKpp: '',
    receiverAccount: '',
    receiverBic: '',
    purpose: '',
    kbk: '',
    oktmo: '',
    uip: '',
    priority: 5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCounterparties, setShowCounterparties] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadCounterparties();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data } = await accountsApi.getAll();
      setAccounts(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, accountId: data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadCounterparties = async () => {
    try {
      const { data } = await counterpartiesApi.getAll();
      setCounterparties(data);
    } catch (error) {
      console.error('Failed to load counterparties:', error);
    }
  };

  const selectCounterparty = (cp: any) => {
    setFormData(prev => ({
      ...prev,
      receiverName: cp.name,
      receiverInn: cp.inn,
      receiverKpp: cp.kpp || '',
      receiverAccount: cp.accountNo,
      receiverBic: cp.bic,
    }));
    setShowCounterparties(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) {
      newErrors.accountId = 'Выберите счет списания';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Укажите корректную сумму';
    }

    if (!formData.receiverName.trim()) {
      newErrors.receiverName = 'Укажите получателя';
    }

    if (!validateINN(formData.receiverInn)) {
      newErrors.receiverInn = 'Неверный ИНН (контрольная сумма)';
    }

    if (!validateBIC(formData.receiverBic)) {
      newErrors.receiverBic = 'Неверный БИК (должен быть 9 цифр, начинаться с 04)';
    }

    if (!validateAccount(formData.receiverAccount)) {
      newErrors.receiverAccount = 'Неверный номер счета (должен быть 20 цифр)';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Укажите назначение платежа';
    } else if (formData.purpose.length > 210) {
      newErrors.purpose = 'Назначение не должно превышать 210 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        accountId: formData.accountId,
        date: formData.date,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        receiver: {
          name: formData.receiverName,
          inn: formData.receiverInn,
          kpp: formData.receiverKpp || undefined,
          accountNo: formData.receiverAccount.replace(/\s/g, ''),
          bic: formData.receiverBic,
        },
        purpose: formData.purpose,
        budget: {
          kbk: formData.kbk || undefined,
          oktmo: formData.oktmo || undefined,
          uip: formData.uip || undefined,
        },
        priority: formData.priority,
      };

      const { data } = await paymentsApi.create(payload);
      router.push(`/dashboard/payments/${data.id}`);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      } else {
        alert('Ошибка создания платежа: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Назад
        </button>
        <h2 className="text-2xl font-bold">Создать платежное поручение</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account and Date */}
        <div className="card">
          <h3 className="font-semibold mb-4">Основные параметры</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Счет списания *</label>
              <select
                className={`input ${errors.accountId ? 'border-red-500' : ''}`}
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              >
                <option value="">Выберите счет</option>
                {accounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNo} - {acc.balance} {acc.currency}
                  </option>
                ))}
              </select>
              {errors.accountId && <p className="text-red-600 text-sm mt-1">{errors.accountId}</p>}
            </div>

            <div>
              <label className="label">Дата платежа *</label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="col-span-2">
              <label className="label">Сумма *</label>
              <input
                type="number"
                step="0.01"
                className={`input ${errors.amount ? 'border-red-500' : ''}`}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="label">Валюта</label>
              <input
                type="text"
                className="input bg-gray-100"
                value={formData.currency}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Получатель</h3>
            <button
              type="button"
              onClick={() => setShowCounterparties(!showCounterparties)}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {showCounterparties ? 'Закрыть' : 'Выбрать из справочника'}
            </button>
          </div>

          {showCounterparties && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              {counterparties.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет контрагентов</p>
              ) : (
                <div className="space-y-2">
                  {counterparties.map((cp: any) => (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => selectCounterparty(cp)}
                      className="w-full text-left p-2 hover:bg-white rounded"
                    >
                      <p className="font-medium text-sm">{cp.name}</p>
                      <p className="text-xs text-gray-600">
                        ИНН: {cp.inn} | {cp.accountNo}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Наименование *</label>
              <input
                type="text"
                className={`input ${errors.receiverName ? 'border-red-500' : ''}`}
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                placeholder="ООО Название компании"
                maxLength={160}
              />
              {errors.receiverName && <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">ИНН *</label>
                <input
                  type="text"
                  className={`input ${errors.receiverInn ? 'border-red-500' : ''}`}
                  value={formData.receiverInn}
                  onChange={(e) => setFormData({ ...formData, receiverInn: formatINN(e.target.value) })}
                  placeholder="7701234567"
                  maxLength={12}
                />
                {errors.receiverInn && <p className="text-red-600 text-sm mt-1">{errors.receiverInn}</p>}
              </div>

              <div>
                <label className="label">КПП</label>
                <input
                  type="text"
                  className="input"
                  value={formData.receiverKpp}
                  onChange={(e) => setFormData({ ...formData, receiverKpp: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  placeholder="770101001"
                  maxLength={9}
                />
              </div>
            </div>

            <div>
              <label className="label">Расчетный счет *</label>
              <input
                type="text"
                className={`input font-mono ${errors.receiverAccount ? 'border-red-500' : ''}`}
                value={formData.receiverAccount}
                onChange={(e) => setFormData({ ...formData, receiverAccount: formatAccountNumber(e.target.value) })}
                placeholder="4070 2810 0000 0000 0001"
              />
              {errors.receiverAccount && <p className="text-red-600 text-sm mt-1">{errors.receiverAccount}</p>}
            </div>

            <div>
              <label className="label">БИК банка получателя *</label>
              <input
                type="text"
                className={`input ${errors.receiverBic ? 'border-red-500' : ''}`}
                value={formData.receiverBic}
                onChange={(e) => setFormData({ ...formData, receiverBic: formatBIC(e.target.value) })}
                placeholder="044525225"
                maxLength={9}
              />
              {errors.receiverBic && <p className="text-red-600 text-sm mt-1">{errors.receiverBic}</p>}
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="card">
          <h3 className="font-semibold mb-4">Назначение платежа</h3>

          <div>
            <label className="label">
              Назначение платежа *
              <span className="text-gray-500 font-normal ml-2">
                ({formData.purpose.length}/210)
              </span>
            </label>
            <textarea
              className={`input ${errors.purpose ? 'border-red-500' : ''}`}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Оплата по счету №123 от 10.10.2025, без НДС"
              rows={3}
              maxLength={210}
            />
            {errors.purpose && <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Рекомендуется до 140 символов для совместимости
            </p>
          </div>
        </div>

        {/* Budget fields (optional) */}
        <div className="card">
          <h3 className="font-semibold mb-4">Бюджетные платежи (необязательно)</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">КБК</label>
              <input
                type="text"
                className="input"
                value={formData.kbk}
                onChange={(e) => setFormData({ ...formData, kbk: e.target.value.replace(/\D/g, '').slice(0, 20) })}
                placeholder="18210102010011000110"
                maxLength={20}
              />
            </div>

            <div>
              <label className="label">ОКТМО</label>
              <input
                type="text"
                className="input"
                value={formData.oktmo}
                onChange={(e) => setFormData({ ...formData, oktmo: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                placeholder="45382000"
              />
            </div>

            <div>
              <label className="label">УИП</label>
              <input
                type="text"
                className="input"
                value={formData.uip}
                onChange={(e) => setFormData({ ...formData, uip: e.target.value.replace(/\D/g, '').slice(0, 25) })}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать платеж'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
