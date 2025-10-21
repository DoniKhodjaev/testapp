# Руководство по развертыванию

## Требования

- Node.js 20+
- Docker и Docker Compose
- pnpm (рекомендуется) или npm
- PostgreSQL 15+ (если запускаете без Docker)
- Redis 7+

## Локальная разработка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd testapp
```

### 2. Установка зависимостей

```bash
# Установить pnpm если не установлен
npm install -g pnpm

# Установить зависимости для всего проекта
pnpm install
```

### 3. Запуск инфраструктуры

```bash
# Запустить PostgreSQL, Redis и MinIO
docker-compose up -d
```

### 4. Настройка Backend

```bash
cd backend

# Создать .env файл
cp .env.example .env

# Отредактировать .env при необходимости
# DATABASE_URL уже настроен для Docker Compose

# Применить миграции
pnpm prisma migrate dev

# Заполнить БД тестовыми данными
pnpm prisma db seed
```

### 5. Настройка Frontend

```bash
cd ../frontend

# Создать .env.local файл
cp .env.local.example .env.local

# По умолчанию API URL уже настроен на http://localhost:3001/api
```

### 6. Запуск приложения

**Вариант 1: Запуск из корня (рекомендуется)**

```bash
# Из корневой директории
pnpm dev
```

Это запустит одновременно backend и frontend:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- API Docs: http://localhost:3001/api/docs

**Вариант 2: Запуск отдельно**

```bash
# Терминал 1 - Backend
cd backend
pnpm dev

# Терминал 2 - Frontend
cd frontend
pnpm dev
```

### 7. Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs
- **Prisma Studio**: `cd backend && pnpm prisma studio` → http://localhost:5555
- **MinIO Console**: http://localhost:9001 (admin/admin123)

### Тестовые пользователи

```
admin@test.ru / Admin123! (Админ)
operator@test.ru / Oper123! (Оператор)
signer@test.ru / Sign123! (Подписант)
viewer@test.ru / View123! (Наблюдатель)
```

## Production Deployment

### Docker Compose (Production)

1. Создать production окружение:

```bash
cp .env.example .env.production
```

2. Отредактировать `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/bank_client
JWT_SECRET=<сгенерировать-длинный-секретный-ключ>
JWT_REFRESH_SECRET=<сгенерировать-другой-длинный-секретный-ключ>
```

3. Собрать и запустить:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. Применить миграции:

```bash
docker-compose -f docker-compose.prod.yml exec backend pnpm prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend pnpm prisma db seed
```

### Kubernetes

См. `k8s/` директорию для манифестов Kubernetes.

Основные шаги:

```bash
# Создать namespace
kubectl create namespace bank-client

# Создать secrets
kubectl create secret generic bank-client-secrets \
  --from-literal=database-url=<DATABASE_URL> \
  --from-literal=jwt-secret=<JWT_SECRET> \
  -n bank-client

# Применить манифесты
kubectl apply -f k8s/
```

### Cloud Providers

#### AWS

- **ECS/Fargate**: Использовать Docker images
- **RDS**: PostgreSQL 15+
- **ElastiCache**: Redis
- **S3**: Для хранения файлов
- **ALB**: Load balancer

#### Google Cloud

- **Cloud Run**: Для backend и frontend
- **Cloud SQL**: PostgreSQL
- **Cloud Memorystore**: Redis
- **Cloud Storage**: Для файлов

#### Azure

- **Azure Container Instances**
- **Azure Database for PostgreSQL**
- **Azure Cache for Redis**
- **Azure Blob Storage**

## Мониторинг

### Health Checks

- Backend health: `GET /api/health`
- Database connectivity: Проверяется в health endpoint

### Логирование

Backend логи пишутся в:
- `stdout` (в production собираются системой логирования)
- Audit logs в БД в таблице `audit_logs`

Рекомендуемые инструменты:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki**
- **CloudWatch** (AWS)
- **Stackdriver** (GCP)

### Метрики

Рекомендуется интегрировать:
- **Prometheus** для сбора метрик
- **Grafana** для визуализации
- **Sentry** для отслеживания ошибок

## Backup и Recovery

### База данных

```bash
# Backup
pg_dump -h localhost -U bank_user bank_client > backup.sql

# Restore
psql -h localhost -U bank_user bank_client < backup.sql
```

### Автоматический backup (cron)

```bash
0 2 * * * pg_dump -h localhost -U bank_user bank_client | gzip > /backups/bank_client_$(date +\%Y\%m\%d).sql.gz
```

### Файлы (MinIO/S3)

Настроить репликацию или периодические snapshots bucket'ов.

## Обновление

### Backend

```bash
cd backend

# Создать новую миграцию (если изменилась схема)
pnpm prisma migrate dev --name <migration-name>

# Деплой миграции на production
pnpm prisma migrate deploy

# Перезапустить сервис
pm2 restart bank-client-backend
# или
docker-compose restart backend
```

### Frontend

```bash
cd frontend

# Собрать новую версию
pnpm build

# Деплой (зависит от платформы)
# Для Vercel/Netlify - автоматически через git push
# Для Docker:
docker-compose up -d --build frontend
```

## Troubleshooting

### Проблема: Backend не подключается к БД

Проверить:
1. PostgreSQL запущен: `docker ps | grep postgres`
2. Корректный DATABASE_URL в .env
3. Сеть Docker: `docker network ls`

### Проблема: Frontend не может достучаться до API

Проверить:
1. Backend запущен: `curl http://localhost:3001/api/health`
2. NEXT_PUBLIC_API_URL в .env.local
3. CORS настройки в backend

### Проблема: Миграции не применяются

```bash
# Проверить статус
pnpm prisma migrate status

# Сбросить БД (только для dev!)
pnpm prisma migrate reset

# Применить миграции вручную
pnpm prisma migrate deploy
```

## Безопасность

### Production Checklist

- [ ] Сгенерировать длинные случайные JWT секреты
- [ ] Настроить HTTPS (Let's Encrypt, CloudFlare, ALB)
- [ ] Включить rate limiting (уже в коде)
- [ ] Настроить firewall (только нужные порты)
- [ ] Регулярные backup'ы БД
- [ ] Мониторинг и алерты
- [ ] Обновлять зависимости (`pnpm update`)
- [ ] Настроить WAF (Web Application Firewall)
- [ ] Логирование всех действий (audit logs)
- [ ] Двухфакторная аутентификация для всех пользователей

## Масштабирование

### Horizontal Scaling

Backend поддерживает горизонтальное масштабирование:

```bash
# Docker Compose
docker-compose up -d --scale backend=3

# Kubernetes
kubectl scale deployment backend --replicas=3
```

### Database

- **Read Replicas**: Настроить PostgreSQL read replicas
- **Connection Pooling**: Использовать PgBouncer
- **Sharding**: При очень больших объемах данных

### Cache

Redis используется для:
- Session storage
- Rate limiting
- Cache для частых запросов (опционально)

### CDN

Для production рекомендуется использовать CDN для статических файлов:
- CloudFlare
- CloudFront (AWS)
- Cloud CDN (GCP)
