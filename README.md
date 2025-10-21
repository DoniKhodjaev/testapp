# Система «Банк-Клиент» - MVP v0.1

Система дистанционного банковского обслуживания для юридических лиц.

## Возможности

- **Аутентификация**: Email/пароль + 2FA (TOTP/SMS)
- **Управление платежами**: Создание, редактирование, подписание, отправка платежных поручений (RUB)
- **Выписки**: Запрос и экспорт выписок по счетам (PDF, XLSX)
- **Валютный контроль**: Загрузка и управление документами ВК
- **Сообщения**: Переписка с банком, требования, ответы
- **Аудит**: Логирование всех операций
- **Роли и права**: Админ, Оператор, Подписант, Наблюдатель

## Архитектура

- **Frontend**: Next.js 14, React, TypeScript, Zustand, React Query, TailwindCSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **БД**: PostgreSQL 15+, Redis
- **Хранилище**: MinIO (S3-compatible)
- **Контейнеризация**: Docker, Docker Compose

## Структура проекта

```
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/   # Бизнес модули
│   │   ├── common/    # Общие утилиты
│   │   └── prisma/    # Prisma schema
│   └── test/
├── frontend/          # Next.js приложение
│   ├── src/
│   │   ├── app/       # App Router страницы
│   │   ├── components/# React компоненты
│   │   ├── lib/       # Утилиты, API клиент
│   │   └── store/     # Zustand stores
├── docker/            # Docker конфигурация
└── docs/              # Документация

```

## Быстрый старт

### Требования

- Node.js 20+
- Docker и Docker Compose
- pnpm (рекомендуется)

### Установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd testapp

# Установить зависимости
pnpm install

# Запустить инфраструктуру (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Применить миграции БД
cd backend
pnpm prisma migrate dev
pnpm prisma db seed

# Запустить backend (порт 3001)
pnpm dev

# В другом терминале - запустить frontend (порт 3000)
cd ../frontend
pnpm dev
```

### Доступ

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **MinIO Console**: http://localhost:9001 (admin/admin123)

### Тестовые данные

После `prisma db seed` будут созданы:

**Компания**: ООО "Тестовая Компания" (ИНН: 7701234567)

**Пользователи**:
- admin@test.ru / Admin123! (Админ компании)
- operator@test.ru / Oper123! (Оператор)
- signer@test.ru / Sign123! (Подписант)
- viewer@test.ru / View123! (Наблюдатель)

**Счета**: 40702810000000000001 (баланс: 1,000,000.00 RUB)

## Разработка

### Backend

```bash
cd backend

# Запуск в dev режиме
pnpm dev

# Тесты
pnpm test
pnpm test:e2e

# Линтинг
pnpm lint

# Создать миграцию
pnpm prisma migrate dev --name migration_name

# Prisma Studio (GUI для БД)
pnpm prisma studio
```

### Frontend

```bash
cd frontend

# Запуск в dev режиме
pnpm dev

# Билд
pnpm build
pnpm start

# Тесты
pnpm test

# Линтинг
pnpm lint
```

## Технические детали

### Безопасность

- TLS 1.2+ для всех соединений
- JWT токены (access 15 мин, refresh 7 дней)
- Пароли: Argon2 hashing
- CSRF protection: SameSite cookies
- CSP headers
- Rate limiting
- Антивирус сканирование файлов

### API

REST API с JSON, детали в `/docs/api.md`

Основные эндпоинты:
- `/auth/*` - Аутентификация
- `/accounts/*` - Счета и выписки
- `/payments/*` - Платежи
- `/messages/*` - Сообщения
- `/users/*` - Пользователи
- `/audit/*` - Аудит

### State Machine платежа

```
DRAFT → ON_APPROVAL → SIGNED → SENT → BANK_ACCEPTED → POSTED
                                  ↓
                              REJECTED / RETURNED
```

### Валидации

- ИНН: 10/12 цифр, контрольная сумма
- БИК: 9 цифр
- Счет: 20 цифр, проверка с БИК
- KBK: 20 цифр
- ОКТМО: 8/11 цифр

См. подробности в `/docs/validations.md`

## Развертывание

### Production

```bash
# Билд образов
docker-compose -f docker-compose.prod.yml build

# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Миграции
docker-compose -f docker-compose.prod.yml exec backend pnpm prisma migrate deploy
```

### Environment Variables

Создайте `.env` файлы:

**backend/.env**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bank_client"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
```

**frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Мониторинг и логи

- Централизованное логирование с trace_id
- Метрики: latency p95, error rate
- Health checks: `/health`

## Roadmap

- [x] v0.1 (MVP): Базовая функциональность
- [ ] v0.2: Пакетные операции, расширенный ВК, 1С-интеграция
- [ ] v0.3: Валютные платежи, SWIFT
- [ ] v0.4: ERP интеграции, вебхуки
- [ ] v0.5: Мобильное приложение

## Лицензия

Proprietary

## Поддержка

support@bank-client.example.com
