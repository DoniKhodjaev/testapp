'use client';

import { useEffect, useState } from 'react';
import { messagesApi } from '@/lib/api';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data } = await messagesApi.getAll();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
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
      <h2 className="text-2xl font-bold">Сообщения</h2>
      <div className="card">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Нет сообщений</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  !message.isRead
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{message.subject}</h3>
                  {!message.isRead && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Новое
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{message.body}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(message.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
