# Быстрый старт - Система «Банк-Клиент»

## ✅ Что уже сделано

Проект **полностью реализован** и закоммичен в Git:
- ✅ Backend (NestJS) - 9 модулей, валидаторы, JWT+2FA
- ✅ Frontend (Next.js 14) - Login, Dashboard, Payments
- ✅ База данных (Prisma schema + seed)
- ✅ Docker Compose конфигурация
- ✅ Полная документация

## 🚀 Запуск на вашей машине

### Шаг 1: Клонировать репозиторий (если еще не клонирован)

```bash
git clone <your-repo-url>
cd testapp
```

### Шаг 2: Запустить инфраструктуру

```bash
# Запустить PostgreSQL, Redis, MinIO через Docker
docker-compose up -d

# Проверить что контейнеры запущены
docker ps
```

Вы должны увидеть 3 контейнера:
- `bank-client-postgres`
- `bank-client-redis`
- `bank-client-minio`

### Шаг 3: Настроить Backend

```bash
cd backend

# Установить pnpm (если еще не установлен)
npm install -g pnpm

# Установить зависимости
pnpm install

# Создать .env файл
cp .env.example .env

# Сгенерировать Prisma Client
pnpm prisma generate

# Применить миграции БД
pnpm prisma migrate dev

# Заполнить тестовыми данными
pnpm prisma db seed
```

### Шаг 4: Запустить Backend

```bash
# В директории backend
pnpm dev
```

Backend запустится на **http://localhost:3001**

Проверьте что работает:
- API: http://localhost:3001/api/health
- Swagger: http://localhost:3001/api/docs

### Шаг 5: Настроить Frontend

```bash
# В новом терминале
cd frontend

# Установить зависимости
pnpm install

# Создать .env.local
cp .env.local.example .env.local

# (По умолчанию уже настроен на http://localhost:3001/api)
```

### Шаг 6: Запустить Frontend

```bash
# В директории frontend
pnpm dev
```

Frontend запустится на **http://localhost:3000**

## 🎯 Вход в систему

Откройте http://localhost:3000

**Тестовые пользователи:**

| Email | Пароль | Роль | Права |
|-------|--------|------|-------|
| admin@test.ru | Admin123! | Админ | Все права |
| operator@test.ru | Oper123! | Оператор | Создание платежей |
| signer@test.ru | Sign123! | Подписант | Подписание платежей |
| viewer@test.ru | View123! | Наблюдатель | Только просмотр |

## 📊 Что можно попробовать

1. **Войти** под разными пользователями
2. **Посмотреть Dashboard** - баланс счета 1,000,000 RUB
3. **Список платежей** - уже есть 3 тестовых платежа
4. **Сообщения** - 2 сообщения от банка
5. **API Docs** - http://localhost:3001/api/docs

## 🛠️ Дополнительные команды

### Prisma Studio (GUI для БД)

```bash
cd backend
pnpm prisma studio
```

Откроется на http://localhost:5555

### MinIO Console (S3 storage)

Откройте http://localhost:9001
- Login: `minioadmin`
- Password: `minioadmin`

### Остановить всё

```bash
# Остановить Docker
docker-compose down

# Остановить backend и frontend
# Ctrl+C в терминалах
```

## 🔍 Troubleshooting

### Проблема: "Cannot connect to database"

```bash
# Проверить что PostgreSQL запущен
docker ps | grep postgres

# Перезапустить контейнеры
docker-compose restart
```

### Проблема: "Port 3001 already in use"

```bash
# Найти процесс
lsof -i :3001

# Убить процесс или изменить PORT в backend/.env
```

### Проблема: Prisma не может сгенерировать клиент

```bash
cd backend

# Очистить и переустановить
rm -rf node_modules
pnpm install
pnpm prisma generate
```

### Сбросить БД и начать заново

```bash
cd backend

# Удалит все данные и применит миграции заново
pnpm prisma migrate reset

# Заполнить тестовыми данными
pnpm prisma db seed
```

## 📚 Дополнительная информация

- **API документация**: `/docs/API.md`
- **Deployment guide**: `/docs/DEPLOYMENT.md`
- **README**: `/README.md`

## ⚡ Быстрый запуск всего сразу

Если хотите запустить backend и frontend одновременно из корня:

```bash
# В корневой директории проекта
pnpm install
pnpm dev
```

Это запустит и backend, и frontend параллельно!

---

## 🎉 Готово!

Теперь у вас работает полноценная система «Банк-Клиент»!

Можете:
- Создавать платежи
- Подписывать их (mock подпись)
- Смотреть выписки
- Управлять пользователями
- Просматривать аудит
