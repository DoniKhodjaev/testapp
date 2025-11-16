// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod models;

use database::Database;
use models::{Employee, FormTemplate, FilledForm};
use std::sync::Mutex;
use tauri::State;

// Состояние приложения
struct AppState {
    db: Mutex<Database>,
}

// Команды для работы с сотрудниками
#[tauri::command]
fn get_employees(state: State<AppState>) -> Result<Vec<Employee>, String> {
    state.db.lock().unwrap().get_employees()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn add_employee(employee: Employee, state: State<AppState>) -> Result<Employee, String> {
    state.db.lock().unwrap().add_employee(employee)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_employee(id: String, employee: Employee, state: State<AppState>) -> Result<(), String> {
    state.db.lock().unwrap().update_employee(&id, employee)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_employee(id: String, state: State<AppState>) -> Result<(), String> {
    state.db.lock().unwrap().delete_employee(&id)
        .map_err(|e| e.to_string())
}

// Команды для работы с шаблонами форм
#[tauri::command]
fn get_templates(state: State<AppState>) -> Result<Vec<FormTemplate>, String> {
    state.db.lock().unwrap().get_templates()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn add_template(template: FormTemplate, state: State<AppState>) -> Result<FormTemplate, String> {
    state.db.lock().unwrap().add_template(template)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_template(id: String, template: FormTemplate, state: State<AppState>) -> Result<(), String> {
    state.db.lock().unwrap().update_template(&id, template)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_template(id: String, state: State<AppState>) -> Result<(), String> {
    state.db.lock().unwrap().delete_template(&id)
        .map_err(|e| e.to_string())
}

// Команды для работы с заполненными формами
#[tauri::command]
fn get_filled_forms(state: State<AppState>) -> Result<Vec<FilledForm>, String> {
    state.db.lock().unwrap().get_filled_forms()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn add_filled_form(form: FilledForm, state: State<AppState>) -> Result<FilledForm, String> {
    state.db.lock().unwrap().add_filled_form(form)
        .map_err(|e| e.to_string())
}

fn main() {
    // Инициализация базы данных
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(db),
        })
        .invoke_handler(tauri::generate_handler![
            get_employees,
            add_employee,
            update_employee,
            delete_employee,
            get_templates,
            add_template,
            update_template,
            delete_template,
            get_filled_forms,
            add_filled_form,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
