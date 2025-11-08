import { useState } from "react";
import { FormTemplate, Employee } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowLeft, FileDown, Printer, Eye } from "lucide-react";
import { filledFormAPI } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { exportToPDF, exportToDOCX } from "../lib/export";

interface FormFillingProps {
  template: FormTemplate;
  employees: Employee[];
  onBack: () => void;
}

export function FormFilling({ template, employees, onBack }: FormFillingProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleSubmit = async () => {
    // Проверяем обязательные поля
    const requiredFields = template.fields.filter((f) => f.required);
    const missingFields = requiredFields.filter(
      (f) => !formData[f.name] || formData[f.name] === ""
    );

    if (!selectedEmployeeId) {
      toast({
        title: "Ошибка",
        description: "Выберите сотрудника",
        variant: "destructive",
      });
      return;
    }

    if (missingFields.length > 0) {
      toast({
        title: "Ошибка",
        description: `Заполните обязательные поля: ${missingFields.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setShowPreview(true);
  };

  const handleExport = async (format: "pdf" | "docx" | "print") => {
    try {
      const completeData = {
        ...formData,
        employee: selectedEmployee,
        template: template,
        date: new Date().toLocaleDateString("ru-RU"),
      };

      // Сохраняем в базу
      await filledFormAPI.add({
        id: crypto.randomUUID(),
        templateId: template.id,
        employeeId: selectedEmployeeId,
        data: completeData,
        createdAt: new Date().toISOString(),
      });

      if (format === "pdf") {
        await exportToPDF(template, completeData);
        toast({
          title: "Успешно",
          description: "Документ сохранен в PDF",
        });
      } else if (format === "docx") {
        await exportToDOCX(template, completeData);
        toast({
          title: "Успешно",
          description: "Документ сохранен в DOCX",
        });
      } else if (format === "print") {
        window.print();
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать документ",
        variant: "destructive",
      });
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || "";

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Выберите вариант"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "employee":
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите сотрудника" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName} — {emp.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return <Input value={value} onChange={(e) => handleFieldChange(field.name, e.target.value)} />;
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-6">
        <Card className="no-print">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Предварительный просмотр</CardTitle>
                <CardDescription>Проверьте данные перед сохранением</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("print")}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Печать
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("docx")}
                  className="gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  DOCX
                </Button>
                <Button onClick={() => handleExport("pdf")} className="gap-2">
                  <FileDown className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="max-w-4xl mx-auto bg-white" id="document-preview">
          <CardContent className="p-12">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">{template.name}</h1>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">ФИО:</div>
                    <div className="font-medium">{selectedEmployee?.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Должность:</div>
                    <div className="font-medium">{selectedEmployee?.position}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Подразделение:</div>
                    <div className="font-medium">{selectedEmployee?.department}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Управление:</div>
                    <div className="font-medium">{selectedEmployee?.division}</div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  {template.fields.map((field) => {
                    const value = formData[field.name];
                    if (!value) return null;

                    let displayValue = value;
                    if (field.type === "employee") {
                      const emp = employees.find((e) => e.id === value);
                      displayValue = emp ? `${emp.fullName} (${emp.position})` : value;
                    }

                    return (
                      <div key={field.id} className="mb-4">
                        <div className="text-sm text-muted-foreground">{field.label}:</div>
                        <div className="font-medium whitespace-pre-wrap">{displayValue}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-6 mt-8">
                  <div className="text-sm text-muted-foreground">
                    Дата: {new Date().toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Выбор сотрудника */}
          <div className="space-y-2">
            <Label>Сотрудник *</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите себя из списка" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.fullName} — {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Автозаполненные поля */}
          {selectedEmployee && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Должность</Label>
                    <div className="mt-1 font-medium">{selectedEmployee.position}</div>
                  </div>
                  <div>
                    <Label>Подразделение</Label>
                    <div className="mt-1 font-medium">{selectedEmployee.department}</div>
                  </div>
                  <div>
                    <Label>Управление</Label>
                    <div className="mt-1 font-medium">{selectedEmployee.division}</div>
                  </div>
                  {selectedEmployee.email && (
                    <div>
                      <Label>Email</Label>
                      <div className="mt-1 font-medium">{selectedEmployee.email}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Динамические поля */}
          <div className="space-y-4 border-t pt-6">
            {template.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Кнопка отправки */}
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Eye className="w-4 h-4" />
              Предварительный просмотр
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
