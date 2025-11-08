// Типы данных для системы управления заявлениями

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  division: string;
  managerId?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "employee";
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[]; // для select полей
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilledForm {
  id: string;
  templateId: string;
  employeeId: string;
  data: Record<string, any>;
  createdAt: string;
}

export type ExportFormat = "pdf" | "docx" | "print";
