import { invoke } from "@tauri-apps/api/tauri";
import { Employee, FormTemplate, FilledForm } from "../types";

// API для работы с сотрудниками
export const employeeAPI = {
  getAll: async (): Promise<Employee[]> => {
    return await invoke("get_employees");
  },

  add: async (employee: Employee): Promise<Employee> => {
    return await invoke("add_employee", { employee });
  },

  update: async (id: string, employee: Employee): Promise<void> => {
    await invoke("update_employee", { id, employee });
  },

  delete: async (id: string): Promise<void> => {
    await invoke("delete_employee", { id });
  },
};

// API для работы с шаблонами
export const templateAPI = {
  getAll: async (): Promise<FormTemplate[]> => {
    return await invoke("get_templates");
  },

  add: async (template: FormTemplate): Promise<FormTemplate> => {
    return await invoke("add_template", { template });
  },

  update: async (id: string, template: FormTemplate): Promise<void> => {
    await invoke("update_template", { id, template });
  },

  delete: async (id: string): Promise<void> => {
    await invoke("delete_template", { id });
  },
};

// API для работы с заполненными формами
export const filledFormAPI = {
  getAll: async (): Promise<FilledForm[]> => {
    return await invoke("get_filled_forms");
  },

  add: async (form: FilledForm): Promise<FilledForm> => {
    return await invoke("add_filled_form", { form });
  },
};
