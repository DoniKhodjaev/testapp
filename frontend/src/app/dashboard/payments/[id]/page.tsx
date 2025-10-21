'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();

  const [payment, setPayment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Sign modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('CONTRACT');

  useEffect(() => {
    loadPayment();
    loadHistory();
    loadFiles();
  }, [params.id]);

  const loadPayment = async () => {
    try {
      const { data } = await paymentsApi.getOne(params.id as string);
      setPayment(data);
    } catch (error) {
      console.error('Failed to load payment:', error);
      alert('Ошибка загрузки платежа');
      router.push('/dashboard/payments');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await paymentsApi.getHistory(params.id as string);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const { data } = await paymentsApi.getFiles(params.id as string);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('docType', docType);

      await paymentsApi.uploadFile(params.id as string, formData);
      setSelectedFile(null);
      setDocType('CONTRACT');
      await loadFiles();
      alert('Файл успешно загружен!');
    } catch (error: any) {
      alert('Ошибка загрузки: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Удалить файл?')) return;

    try {
      await paymentsApi.deleteFile(params.id as string, fileId);
      await loadFiles();
      alert('Файл удален');
    } catch (error: any) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Отправить платеж на согласование?')) return;

    try {
      await paymentsApi.submit(params.id as string);
      await loadPayment();
      await loadHistory();
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      // Mock signature
      const mockSignature = btoa(`MOCK_SIGNATURE_${Date.now()}`);
      const mockCert = 'ABCDEF1234567890';

      await paymentsApi.sign(params.id as string, {
        signatureType: 'CMS',
        signature: mockSignature,
        certThumbprint: mockCert,
      });

      setShowSignModal(false);
      await loadPayment();
      await loadHistory();
      alert('Платеж успешно подписан!');
    } catch (error: any) {
      alert('Ошибка подписания: ' + (error.response?.data?.message || error.message));
    } finally {
      setSigning(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Отправить платеж в банк?')) return;

    try {
      await paymentsApi.send(params.id as string);
      await loadPayment();
      await loadHistory();
      alert('Платеж отправлен в банк!');
    } catch (error: any) {
      alert('Ошибка отправки: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить платеж? Это действие нельзя отменить.')) return;

    try {
      await paymentsApi.delete(params.id as string);
      router.push('/dashboard/payments');
    } catch (error: any) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-700',
      ON_APPROVAL: 'bg-yellow-100 text-yellow-700',
      SIGNED: 'bg-blue-100 text-blue-700',
      SENT: 'bg-purple-100 text-purple-700',
      BANK_ACCEPTED: 'bg-indigo-100 text-indigo-700',
      POSTED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      RETURNED: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const canEdit = payment?.status === 'DRAFT' && user?.permissions?.includes('payments:edit');
  const canSubmit = payment?.status === 'DRAFT' && user?.permissions?.includes('payments:create');
  const canSign = payment?.status === 'ON_APPROVAL' && user?.permissions?.includes('payments:sign');
  const canSend = payment?.status === 'SIGNED' && user?.permissions?.includes('payments:send');
  const canDelete = payment?.status === 'DRAFT' && user?.permissions?.includes('payments:delete');

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (!payment) {
    return <div>Платеж не найден</div>;
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/payments')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← К списку платежей
          </button>
          <h2 className="text-2xl font-bold">
            Платежное поручение {payment.docNumber || `#${payment.id.slice(0, 8)}`}
          </h2>
        </div>

        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        {canEdit && (
          <button className="btn btn-secondary text-sm">
            Редактировать
          </button>
        )}
        {canSubmit && (
          <button onClick={handleSubmit} className="btn btn-primary text-sm">
            На согласование
          </button>
        )}
        {canSign && (
          <button onClick={() => setShowSignModal(true)} className="btn btn-primary text-sm">
            Подписать
          </button>
        )}
        {canSend && (
          <button onClick={handleSend} className="btn btn-primary text-sm">
            Отправить в банк
          </button>
        )}
        {canDelete && (
          <button onClick={handleDelete} className="btn btn-danger text-sm">
            Удалить
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          {['details', 'history', 'files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'details' && 'Реквизиты'}
              {tab === 'history' && 'История'}
              {tab === 'files' && 'Файлы'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Main info */}
          <div className="card">
            <h3 className="font-semibold mb-4">Основная информация</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Дата</p>
                <p className="font-medium">{formatDate(payment.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Сумма</p>
                <p className="font-medium text-lg">{formatCurrency(payment.amount, payment.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Счет списания</p>
                <p className="font-mono text-sm">{payment.account.accountNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Приоритет</p>
                <p className="font-medium">{payment.priority}</p>
              </div>
            </div>
          </div>

          {/* Receiver */}
          <div className="card">
            <h3 className="font-semibold mb-4">Получатель</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Наименование</p>
                <p className="font-medium">{payment.receiverName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ИНН</p>
                  <p className="font-mono">{payment.receiverInn}</p>
                </div>
                {payment.receiverKpp && (
                  <div>
                    <p className="text-sm text-gray-600">КПП</p>
                    <p className="font-mono">{payment.receiverKpp}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Расчетный счет</p>
                <p className="font-mono">{payment.receiverAccount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">БИК</p>
                <p className="font-mono">{payment.receiverBic}</p>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="card">
            <h3 className="font-semibold mb-4">Назначение платежа</h3>
            <p className="text-gray-800">{payment.purpose}</p>
          </div>

          {/* Budget fields */}
          {(payment.kbk || payment.oktmo || payment.uip) && (
            <div className="card">
              <h3 className="font-semibold mb-4">Бюджетные реквизиты</h3>
              <div className="grid grid-cols-3 gap-4">
                {payment.kbk && (
                  <div>
                    <p className="text-sm text-gray-600">КБК</p>
                    <p className="font-mono">{payment.kbk}</p>
                  </div>
                )}
                {payment.oktmo && (
                  <div>
                    <p className="text-sm text-gray-600">ОКТМО</p>
                    <p className="font-mono">{payment.oktmo}</p>
                  </div>
                )}
                {payment.uip && (
                  <div>
                    <p className="text-sm text-gray-600">УИП</p>
                    <p className="font-mono">{payment.uip}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signatures */}
          {payment.signatures && payment.signatures.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Подписи</h3>
              <div className="space-y-2">
                {payment.signatures.map((sig: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div>
                      <p className="font-medium">{sig.user.email}</p>
                      <p className="text-sm text-gray-600">
                        {sig.signatureType} | Сертификат: {sig.certThumbprint}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{formatDateTime(sig.signedAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="font-semibold mb-4">История изменений</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Нет истории</p>
          ) : (
            <div className="space-y-3">
              {history.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        {item.fromStatus ? `${item.fromStatus} → ` : ''}
                        {item.toStatus}
                      </p>
                      <p className="text-sm text-gray-500">{formatDateTime(item.createdAt)}</p>
                    </div>
                    {item.comment && <p className="text-sm text-gray-600 mt-1">{item.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-6">
          {/* Upload section */}
          {user?.permissions?.includes('vkdocs:upload') &&
            ['DRAFT', 'ON_APPROVAL'].includes(payment.status) && (
              <div className="card">
                <h3 className="font-semibold mb-4">Загрузить файл ВК</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Тип документа</label>
                    <select
                      className="input"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      <option value="CONTRACT">Контракт</option>
                      <option value="INVOICE">Инвойс</option>
                      <option value="SUPPORTING">Подтверждающие документы</option>
                      <option value="OTHER">Прочее</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Файл</label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        Выбран: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? 'Загрузка...' : 'Загрузить'}
                  </button>
                </div>
              </div>
            )}

          {/* Files list */}
          <div className="card">
            <h3 className="font-semibold mb-4">Загруженные файлы</h3>
            {files.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Нет файлов</p>
            ) : (
              <div className="space-y-3">
                {files.map((file: any) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xl">📄</span>
                        </div>
                        <div>
                          <p className="font-medium">{file.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {file.docType} • {(file.fileSize / 1024).toFixed(2)} KB •{' '}
                            {formatDateTime(file.uploadedAt)} • {file.uploader?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          file.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : file.status === 'NEEDS_CORRECTION'
                            ? 'bg-orange-100 text-orange-700'
                            : file.status === 'UNDER_REVIEW'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {file.status}
                      </span>
                      {user?.permissions?.includes('vkdocs:upload') &&
                        ['DRAFT', 'ON_APPROVAL'].includes(payment.status) && (
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Удалить
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Подписание платежа</h3>
            <p className="text-gray-600 mb-6">
              Платеж будет подписан вашей электронной подписью.
            </p>
            <div className="bg-gray-50 p-3 rounded mb-6">
              <p className="text-sm text-gray-600">Сумма</p>
              <p className="font-bold text-lg">{formatCurrency(payment.amount, payment.currency)}</p>
              <p className="text-sm text-gray-600 mt-2">Получатель</p>
              <p className="font-medium">{payment.receiverName}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSign}
                className="btn btn-primary flex-1"
                disabled={signing}
              >
                {signing ? 'Подписание...' : 'Подписать'}
              </button>
              <button
                onClick={() => setShowSignModal(false)}
                className="btn btn-secondary flex-1"
                disabled={signing}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
