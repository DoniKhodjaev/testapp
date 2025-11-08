import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { Employee } from "../../types";
import { employeeAPI } from "../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export function EmployeeManagement() {
  const { employees, setEmployees, addEmployee, updateEmployee, deleteEmployee } = useStore();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: "",
    position: "",
    department: "",
    division: "",
    managerId: "",
    email: "",
    phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeAPI.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        fullName: employee.fullName,
        position: employee.position,
        department: employee.department,
        division: employee.division,
        managerId: employee.managerId || "",
        email: employee.email || "",
        phone: employee.phone || "",
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        fullName: "",
        position: "",
        department: "",
        division: "",
        managerId: "",
        email: "",
        phone: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const now = new Date().toISOString();

      if (editingEmployee) {
        // Обновление
        const updated: Employee = {
          ...editingEmployee,
          ...formData,
          updatedAt: now,
        } as Employee;

        await employeeAPI.update(editingEmployee.id, updated);
        updateEmployee(editingEmployee.id, updated);

        toast({
          title: "Успешно",
          description: "Сотрудник обновлен",
        });
      } else {
        // Создание
        const newEmployee: Employee = {
          id: crypto.randomUUID(),
          ...formData,
          createdAt: now,
          updatedAt: now,
        } as Employee;

        await employeeAPI.add(newEmployee);
        addEmployee(newEmployee);

        toast({
          title: "Успешно",
          description: "Сотрудник добавлен",
        });
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить данные сотрудника",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого сотрудника?")) {
      return;
    }

    try {
      await employeeAPI.delete(id);
      deleteEmployee(id);

      toast({
        title: "Успешно",
        description: "Сотрудник удален",
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить сотрудника",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление сотрудниками</CardTitle>
              <CardDescription>
                Добавляйте, редактируйте и удаляйте сотрудников
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить сотрудника
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет сотрудников в базе данных</p>
              <p className="text-sm mt-2">Добавьте первого сотрудника</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">ФИО</th>
                    <th className="text-left py-3 px-4">Должность</th>
                    <th className="text-left py-3 px-4">Подразделение</th>
                    <th className="text-left py-3 px-4">Управление</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-right py-3 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{employee.fullName}</td>
                      <td className="py-3 px-4">{employee.position}</td>
                      <td className="py-3 px-4">{employee.department}</td>
                      <td className="py-3 px-4">{employee.division}</td>
                      <td className="py-3 px-4">{employee.email || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(employee)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Редактировать сотрудника" : "Добавить сотрудника"}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о сотруднике
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">ФИО *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Должность *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="Менеджер"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Подразделение *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="Отдел продаж"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Управление *</Label>
              <Input
                id="division"
                value={formData.division}
                onChange={(e) =>
                  setFormData({ ...formData, division: e.target.value })
                }
                placeholder="Коммерческое управление"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="ivanov@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="manager">Руководитель</Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, managerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите руководителя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Нет руководителя</SelectItem>
                  {employees
                    .filter((e) => e.id !== editingEmployee?.id)
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} — {employee.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.fullName ||
                !formData.position ||
                !formData.department ||
                !formData.division
              }
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
