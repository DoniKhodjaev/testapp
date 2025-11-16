use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Employee {
    pub id: String,
    pub full_name: String,
    pub position: String,
    pub department: String,
    pub division: String,
    pub manager_id: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormField {
    pub id: String,
    pub name: String,
    pub label: String,
    #[serde(rename = "type")]
    pub field_type: String,
    pub required: bool,
    pub placeholder: Option<String>,
    pub default_value: Option<String>,
    pub options: Option<Vec<String>>,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub fields: Vec<FormField>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilledForm {
    pub id: String,
    pub template_id: String,
    pub employee_id: String,
    pub data: serde_json::Value,
    pub created_at: String,
}
