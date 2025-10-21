# API Documentation

## Base URL

```
http://localhost:3001/api
```

Production: `https://your-domain.com/api`

## Authentication

Все эндпоинты (кроме `/auth/login`) требуют JWT токен в header:

```
Authorization: Bearer <access_token>
```

### Получение токена

**POST** `/auth/login`

Request:
```json
{
  "email": "admin@test.ru",
  "password": "Admin123!"
}
```

Response (без MFA):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@test.ru",
    "role": "ADMIN",
    "company": {...}
  }
}
```

Response (с MFA):
```json
{
  "mfaRequired": true,
  "tempToken": "eyJhbGc..."
}
```

### MFA Verification

**POST** `/auth/mfa/verify`

```json
{
  "tempToken": "eyJhbGc...",
  "code": "123456"
}
```

### Refresh Token

**POST** `/auth/refresh`

```json
{
  "refreshToken": "eyJhbGc..."
}
```

## Endpoints

### Accounts

#### GET `/accounts`

Получить все счета компании.

Response:
```json
[
  {
    "id": "uuid",
    "accountNo": "40702810000000000001",
    "bic": "044525225",
    "bankName": "ПАО Тестовый Банк",
    "currency": "RUB",
    "balance": "1000000.00",
    "isActive": true
  }
]
```

#### GET `/accounts/:id/statements`

Query params:
- `from` - дата начала (YYYY-MM-DD)
- `to` - дата окончания (YYYY-MM-DD)

### Payments

#### GET `/payments`

Query params:
- `status` - фильтр по статусу
- `from` - дата с
- `to` - дата по
- `q` - поиск
- `skip`, `take` - пагинация

Response:
```json
{
  "items": [...],
  "total": 10
}
```

#### POST `/payments`

Создать платеж.

Request:
```json
{
  "accountId": "uuid",
  "date": "2025-10-19",
  "amount": 12345.67,
  "currency": "RUB",
  "receiver": {
    "name": "ООО Ромашка",
    "inn": "7701234567",
    "kpp": "770101001",
    "accountNo": "40702810000000000001",
    "bic": "044525225"
  },
  "purpose": "Оплата по счёту №123 от 10.10.2025, без НДС",
  "budget": {
    "kbk": null,
    "oktmo": null,
    "uip": null
  },
  "priority": 5
}
```

Validation errors response:
```json
{
  "errors": [
    {
      "field": "receiver.inn",
      "code": "INVALID_INN",
      "message": "Invalid INN checksum"
    }
  ]
}
```

#### PUT `/payments/:id`

Обновить платеж (только DRAFT или ON_APPROVAL).

#### POST `/payments/:id/submit`

Отправить на согласование (DRAFT → ON_APPROVAL).

#### POST `/payments/:id/sign`

Подписать платеж (ON_APPROVAL → SIGNED).

Request:
```json
{
  "signatureType": "CMS",
  "signature": "base64-encoded-signature",
  "certThumbprint": "sha256-thumbprint",
  "chain": ["cert1", "cert2"]
}
```

#### POST `/payments/:id/send`

Отправить в банк (SIGNED → SENT).

#### DELETE `/payments/:id`

Удалить платеж (только DRAFT).

#### GET `/payments/:id/history`

История изменений платежа.

### Counterparties

#### GET `/counterparties`

Query: `?query=<search>`

#### POST `/counterparties`

```json
{
  "name": "ООО Ромашка",
  "inn": "7701234567",
  "kpp": "770101001",
  "accountNo": "40702810000000000001",
  "bic": "044525225"
}
```

### Messages

#### GET `/messages`

Query:
- `unread=true` - только непрочитанные
- `type` - тип сообщения

#### POST `/messages/:id/reply`

```json
{
  "body": "Ответ на сообщение"
}
```

### Users

Требует права `users:manage`.

#### GET `/users`

#### POST `/users`

```json
{
  "email": "user@example.com",
  "phone": "+79991234567",
  "password": "SecurePass123!",
  "role": "OPERATOR",
  "permissions": ["payments:create", "payments:view"],
  "limits": {
    "dailyLimit": 1000000
  }
}
```

#### PUT `/users/:id`

#### POST `/users/:id/mfa/reset`

### Audit

Требует права `audit:view`.

#### GET `/audit`

Query:
- `from`, `to` - период
- `action` - тип действия
- `userId` - по пользователю

## Payment State Machine

```
DRAFT → ON_APPROVAL → SIGNED → SENT → BANK_ACCEPTED → POSTED
                                 ↓
                             REJECTED / RETURNED
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Receiver INN checksum invalid",
  "details": [
    {
      "field": "receiver.inn",
      "code": "CHECKSUM",
      "hint": "10 or 12 digits"
    }
  ],
  "traceId": "abc-123"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Missing required permissions: payments:sign"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Payment not found"
}
```

### 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

## Rate Limiting

Default: 100 запросов в минуту на IP.

## Swagger Documentation

Interactive API docs доступны по адресу:

```
http://localhost:3001/api/docs
```

Здесь можно:
- Посмотреть все эндпоинты
- Попробовать запросы
- Посмотреть схемы данных
