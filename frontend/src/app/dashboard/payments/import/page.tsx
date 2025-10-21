'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function ImportPaymentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Выберите файл');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post('/payments/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(data);

      if (data.created > 0) {
        setTimeout(() => {
          router.push('/dashboard/payments');
        }, 3000);
      }
    } catch (error: any) {
      alert('Ошибка импорта: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = `Account;Date;Amount;Currency;ReceiverName;ReceiverINN;ReceiverKPP;ReceiverAccount;ReceiverBIC;Purpose;KBK;OKTMO;UIP
40702810000000000001;2025-10-21;15000.50;RUB;ООО Ромашка;7701234567;770101001;40702810100000000002;044525226;Оплата по счету №123, без НДС;;;
40702810000000000001;2025-10-21;25000.00;RUB;АО Василек;7703234567;770301001;40702810200000000003;044525227;Оплата за услуги;;;`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'payments_sample.csv';
    link.click();
  };

  const downloadErrors = () => {
    if (!result || !result.errors || result.errors.length === 0) return;

    const csvContent =
      'Row;Field;Code;Message\n' +
      result.errors
        .map((err: any) => `${err.row};${err.field};${err.code};${err.message}`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'import_errors.csv';
    link.click();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          ← Назад
        </button>
        <h2 className="text-2xl font-bold">Импорт платежей</h2>
      </div>

      {/* Instructions */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-3">Инструкция по импорту</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Подготовьте файл в формате CSV или XLSX</li>
          <li>Файл должен содержать заголовки в первой строке</li>
          <li>Обязательные поля: Account, Date, Amount, ReceiverName, ReceiverINN, ReceiverAccount, ReceiverBIC, Purpose</li>
          <li>Формат даты: YYYY-MM-DD (например, 2025-10-21)</li>
          <li>Разделитель для CSV: точка с запятой (;)</li>
        </ol>

        <button onClick={downloadSample} className="btn btn-secondary text-sm mt-4">
          📥 Скачать образец файла
        </button>
      </div>

      {/* Upload */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Загрузка файла</h3>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            {file ? (
              <div>
                <div className="text-4xl mb-2">📄</div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 mt-2"
                >
                  Удалить
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📁</div>
                <p className="text-gray-600">
                  Нажмите для выбора файла
                  <br />
                  <span className="text-sm text-gray-500">CSV или XLSX, до 5MB</span>
                </p>
              </div>
            )}
          </label>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="btn btn-primary w-full mt-4"
        >
          {loading ? 'Импорт...' : 'Импортировать'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card">
          <h3 className="font-semibold mb-4">Результаты импорта</h3>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-sm text-gray-600">Всего строк</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">{result.created}</p>
              <p className="text-sm text-gray-600">Создано</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-2xl font-bold text-blue-600">{result.valid}</p>
              <p className="text-sm text-gray-600">Валидных</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-2xl font-bold text-red-600">{result.invalid}</p>
              <p className="text-sm text-gray-600">С ошибками</p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-red-600">
                  Ошибки ({result.errors.length})
                </h4>
                <button onClick={downloadErrors} className="text-sm text-primary-600 hover:text-primary-800">
                  Скачать CSV с ошибками
                </button>
              </div>

              <div className="bg-red-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {result.errors.slice(0, 10).map((err: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <span className="font-mono text-red-700">Строка {err.row}:</span>{' '}
                      <span className="text-gray-700">
                        {err.field} - {err.message}
                      </span>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-sm text-gray-500 italic">
                      ... и еще {result.errors.length - 10} ошибок
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {result.created > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">
                ✅ Успешно создано {result.created} платежей!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Перенаправление на список платежей...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Format reference */}
      <div className="card mt-6">
        <h3 className="font-semibold mb-3">Формат полей</h3>
        <div className="text-sm space-y-2 text-gray-700">
          <p><strong>Account:</strong> 20 цифр (номер счета списания)</p>
          <p><strong>Date:</strong> YYYY-MM-DD</p>
          <p><strong>Amount:</strong> Число с точкой (например, 15000.50)</p>
          <p><strong>Currency:</strong> RUB</p>
          <p><strong>ReceiverName:</strong> Текст, до 160 символов</p>
          <p><strong>ReceiverINN:</strong> 10 или 12 цифр</p>
          <p><strong>ReceiverKPP:</strong> 9 цифр (необязательно)</p>
          <p><strong>ReceiverAccount:</strong> 20 цифр</p>
          <p><strong>ReceiverBIC:</strong> 9 цифр</p>
          <p><strong>Purpose:</strong> Текст, до 210 символов</p>
          <p><strong>KBK, OKTMO, UIP:</strong> Необязательные бюджетные поля</p>
        </div>
      </div>
    </div>
  );
}
