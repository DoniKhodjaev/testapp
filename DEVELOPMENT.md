# Руководство для разработчиков

## Архитектура приложения

### Frontend (React + TypeScript)

#### Структура компонентов

```
src/
├── components/
│   ├── EmployeeView.tsx          # Интерфейс для сотрудников
│   ├── AdminView.tsx              # Панель администратора
│   ├── FormFilling.tsx            # Форма заполнения заявления
│   ├── admin/
│   │   ├── EmployeeManagement.tsx # CRUD сотрудников
│   │   ├── TemplateManagement.tsx # CRUD шаблонов
│   │   └── TemplateEditor.tsx     # Визуальный редактор форм
│   └── ui/                        # ShadCN UI компоненты
```

#### State Management (Zustand)

Глобальное состояние приложения:

```typescript
interface AppState {
  employees: Employee[];
  templates: FormTemplate[];
  filledForms: FilledForm[];
  // ... методы для работы с данными
}
```

#### API Layer

Все вызовы к Tauri backend через `src/lib/api.ts`:

```typescript
// Пример
const employees = await employeeAPI.getAll();
await employeeAPI.add(newEmployee);
```

### Backend (Tauri + Rust)

#### Структура

```
src-tauri/src/
├── main.rs       # Точка входа, регистрация команд
├── database.rs   # Работа с SQLite
└── models.rs     # Структуры данных
```

#### Команды Tauri

Все команды доступны из frontend через `invoke()`:

```rust
#[tauri::command]
fn get_employees(state: State<AppState>) -> Result<Vec<Employee>, String>
```

## Добавление нового типа поля

### 1. Обновите типы

`src/types/index.ts`:

```typescript
export interface FormField {
  type: "text" | "textarea" | "date" | "number" | "select" | "employee" | "НОВЫЙ_ТИП";
  // ...
}
```

### 2. Добавьте рендеринг

`src/components/FormFilling.tsx`:

```typescript
case "НОВЫЙ_ТИП":
  return <НовыйКомпонент ... />;
```

### 3. Добавьте в редактор

`src/components/admin/TemplateEditor.tsx`:

```typescript
<SelectItem value="НОВЫЙ_ТИП">Название типа</SelectItem>
```

## Кастомизация экспорта

### PDF

Редактируйте `src/lib/export.ts`, функция `exportToPDF()`.

Для поддержки кириллицы:

1. Добавьте шрифт в проект
2. Загрузите через `doc.addFont()`
3. Установите через `doc.setFont()`

### DOCX

Функция `exportToDOCX()` использует библиотеку `docx`.

Пример добавления стилей:

```typescript
new Paragraph({
  text: "Текст",
  heading: HeadingLevel.HEADING_1,
  alignment: AlignmentType.CENTER,
})
```

## База данных

### Схема

```sql
-- Сотрудники
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  division TEXT NOT NULL,
  manager_id TEXT,
  email TEXT,
  phone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Шаблоны
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  fields TEXT NOT NULL,  -- JSON
  is_active INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Заполненные формы
CREATE TABLE filled_forms (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  data TEXT NOT NULL,  -- JSON
  created_at TEXT NOT NULL
);
```

### Миграции

При изменении схемы базы данных:

1. Обновите `src-tauri/src/database.rs`
2. Добавьте миграцию в `Database::new()`
3. Используйте версионирование схемы

## Тестирование

### Frontend

```bash
# TODO: добавить тесты
npm run test
```

### Backend

```bash
cd src-tauri
cargo test
```

## Сборка для продакшена

### Windows

```bash
npm run tauri:build
```

Результат: `src-tauri/target/release/bundle/msi/`

### Подпись кода (опционально)

Для Windows требуется сертификат для подписи:

```json
// tauri.conf.json
"windows": {
  "certificateThumbprint": "YOUR_CERT_THUMBPRINT"
}
```

## Отладка

### React DevTools

Используйте расширение React DevTools в режиме разработки.

### Rust консоль

```rust
println!("Debug: {:?}", variable);
```

Вывод будет в терминале где запущен `npm run tauri:dev`.

### База данных

Используйте SQLite браузер для просмотра данных:

- Windows: `%LOCALAPPDATA%\hr-forms-management\database.db`
- macOS: `~/Library/Application Support/hr-forms-management/database.db`
- Linux: `~/.local/share/hr-forms-management/database.db`

## Производительность

### Оптимизация React

- Используйте `React.memo()` для тяжелых компонентов
- Оптимизируйте ре-рендеры через `useMemo` и `useCallback`

### Оптимизация Rust

- Используйте индексы в SQL запросах
- Кэшируйте частые запросы
- Асинхронная обработка для тяжелых операций

## Безопасность

### Валидация данных

Всегда валидируйте данные на стороне Rust:

```rust
if employee.full_name.trim().is_empty() {
  return Err("Name is required".to_string());
}
```

### SQL Injection

Используйте параметризованные запросы (уже реализовано через `rusqlite::params!`).

## Часто задаваемые вопросы

### Как добавить новую команду Tauri?

1. Создайте функцию в `src-tauri/src/main.rs`:

```rust
#[tauri::command]
fn my_command(param: String) -> Result<String, String> {
  Ok(param)
}
```

2. Зарегистрируйте в `main()`:

```rust
.invoke_handler(tauri::generate_handler![
  my_command,
  // ... другие команды
])
```

3. Вызовите из frontend:

```typescript
import { invoke } from "@tauri-apps/api/tauri";
const result = await invoke("my_command", { param: "value" });
```

### Как обновить зависимости?

```bash
# Frontend
npm update

# Backend
cd src-tauri
cargo update
```

### Как изменить размер окна?

Редактируйте `src-tauri/tauri.conf.json`:

```json
"windows": [{
  "width": 1280,
  "height": 800,
  "minWidth": 800,
  "minHeight": 600
}]
```
