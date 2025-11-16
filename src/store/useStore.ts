import { create } from "zustand";
import { Employee, FormTemplate, FilledForm } from "../types";

interface AppState {
  // Сотрудники
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Шаблоны форм
  templates: FormTemplate[];
  setTemplates: (templates: FormTemplate[]) => void;
  addTemplate: (template: FormTemplate) => void;
  updateTemplate: (id: string, template: Partial<FormTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Заполненные формы
  filledForms: FilledForm[];
  setFilledForms: (forms: FilledForm[]) => void;
  addFilledForm: (form: FilledForm) => void;
}

export const useStore = create<AppState>((set) => ({
  // Сотрудники
  employees: [],
  setEmployees: (employees) => set({ employees }),
  addEmployee: (employee) =>
    set((state) => ({ employees: [...state.employees, employee] })),
  updateEmployee: (id, updatedEmployee) =>
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updatedEmployee } : emp
      ),
    })),
  deleteEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    })),

  // Шаблоны форм
  templates: [],
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (id, updatedTemplate) =>
    set((state) => ({
      templates: state.templates.map((tmpl) =>
        tmpl.id === id ? { ...tmpl, ...updatedTemplate } : tmpl
      ),
    })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((tmpl) => tmpl.id !== id),
    })),

  // Заполненные формы
  filledForms: [],
  setFilledForms: (forms) => set({ filledForms: forms }),
  addFilledForm: (form) =>
    set((state) => ({ filledForms: [...state.filledForms, form] })),
}));
