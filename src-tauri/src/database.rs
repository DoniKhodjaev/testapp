use crate::models::{Employee, FormTemplate, FilledForm};
use rusqlite::{params, Connection, Result};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        // Получаем путь к директории данных приложения
        let mut db_path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        db_path.push("hr-forms-management");
        std::fs::create_dir_all(&db_path).ok();
        db_path.push("database.db");

        let conn = Connection::open(db_path)?;

        // Создаем таблицы
        conn.execute(
            "CREATE TABLE IF NOT EXISTS employees (
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
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                fields TEXT NOT NULL,
                is_active INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS filled_forms (
                id TEXT PRIMARY KEY,
                template_id TEXT NOT NULL,
                employee_id TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (template_id) REFERENCES templates(id),
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )",
            [],
        )?;

        Ok(Database { conn })
    }

    // Методы для работы с сотрудниками
    pub fn get_employees(&self) -> Result<Vec<Employee>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, full_name, position, department, division, manager_id, email, phone, created_at, updated_at
             FROM employees ORDER BY full_name"
        )?;

        let employees = stmt.query_map([], |row| {
            Ok(Employee {
                id: row.get(0)?,
                full_name: row.get(1)?,
                position: row.get(2)?,
                department: row.get(3)?,
                division: row.get(4)?,
                manager_id: row.get(5)?,
                email: row.get(6)?,
                phone: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(employees)
    }

    pub fn add_employee(&self, employee: Employee) -> Result<Employee> {
        self.conn.execute(
            "INSERT INTO employees (id, full_name, position, department, division, manager_id, email, phone, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                employee.id,
                employee.full_name,
                employee.position,
                employee.department,
                employee.division,
                employee.manager_id,
                employee.email,
                employee.phone,
                employee.created_at,
                employee.updated_at,
            ],
        )?;

        Ok(employee)
    }

    pub fn update_employee(&self, id: &str, employee: Employee) -> Result<()> {
        self.conn.execute(
            "UPDATE employees SET full_name = ?1, position = ?2, department = ?3, division = ?4,
             manager_id = ?5, email = ?6, phone = ?7, updated_at = ?8 WHERE id = ?9",
            params![
                employee.full_name,
                employee.position,
                employee.department,
                employee.division,
                employee.manager_id,
                employee.email,
                employee.phone,
                employee.updated_at,
                id,
            ],
        )?;

        Ok(())
    }

    pub fn delete_employee(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM employees WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Методы для работы с шаблонами
    pub fn get_templates(&self) -> Result<Vec<FormTemplate>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, fields, is_active, created_at, updated_at
             FROM templates ORDER BY name"
        )?;

        let templates = stmt.query_map([], |row| {
            let fields_json: String = row.get(3)?;
            let fields = serde_json::from_str(&fields_json).unwrap_or_default();

            Ok(FormTemplate {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                fields,
                is_active: row.get::<_, i32>(4)? == 1,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(templates)
    }

    pub fn add_template(&self, template: FormTemplate) -> Result<FormTemplate> {
        let fields_json = serde_json::to_string(&template.fields).unwrap();

        self.conn.execute(
            "INSERT INTO templates (id, name, description, fields, is_active, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                template.id,
                template.name,
                template.description,
                fields_json,
                if template.is_active { 1 } else { 0 },
                template.created_at,
                template.updated_at,
            ],
        )?;

        Ok(template)
    }

    pub fn update_template(&self, id: &str, template: FormTemplate) -> Result<()> {
        let fields_json = serde_json::to_string(&template.fields).unwrap();

        self.conn.execute(
            "UPDATE templates SET name = ?1, description = ?2, fields = ?3, is_active = ?4, updated_at = ?5
             WHERE id = ?6",
            params![
                template.name,
                template.description,
                fields_json,
                if template.is_active { 1 } else { 0 },
                template.updated_at,
                id,
            ],
        )?;

        Ok(())
    }

    pub fn delete_template(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM templates WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Методы для работы с заполненными формами
    pub fn get_filled_forms(&self) -> Result<Vec<FilledForm>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, template_id, employee_id, data, created_at FROM filled_forms ORDER BY created_at DESC"
        )?;

        let forms = stmt.query_map([], |row| {
            let data_json: String = row.get(3)?;
            let data = serde_json::from_str(&data_json).unwrap_or(serde_json::Value::Null);

            Ok(FilledForm {
                id: row.get(0)?,
                template_id: row.get(1)?,
                employee_id: row.get(2)?,
                data,
                created_at: row.get(4)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(forms)
    }

    pub fn add_filled_form(&self, form: FilledForm) -> Result<FilledForm> {
        let data_json = serde_json::to_string(&form.data).unwrap();

        self.conn.execute(
            "INSERT INTO filled_forms (id, template_id, employee_id, data, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                form.id,
                form.template_id,
                form.employee_id,
                data_json,
                form.created_at,
            ],
        )?;

        Ok(form)
    }
}

// Добавляем dirs как зависимость
mod dirs {
    use std::path::PathBuf;

    pub fn data_local_dir() -> Option<PathBuf> {
        if cfg!(target_os = "windows") {
            std::env::var("LOCALAPPDATA").ok().map(PathBuf::from)
        } else if cfg!(target_os = "macos") {
            std::env::var("HOME")
                .ok()
                .map(|home| PathBuf::from(home).join("Library/Application Support"))
        } else {
            std::env::var("HOME")
                .ok()
                .map(|home| PathBuf::from(home).join(".local/share"))
        }
    }
}
