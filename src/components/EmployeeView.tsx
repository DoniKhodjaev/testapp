import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { FormTemplate, Employee } from "../types";
import { templateAPI, employeeAPI } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { FileText, Loader2 } from "lucide-react";
import { FormFilling } from "./FormFilling";
import { useToast } from "../hooks/use-toast";

export function EmployeeView() {
  const { templates, setTemplates, employees, setEmployees } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, employeesData] = await Promise.all([
        templateAPI.getAll(),
        employeeAPI.getAll(),
      ]);

      // Фильтруем только активные шаблоны для сотрудников
      const activeTemplates = templatesData.filter((t) => t.isActive);
      setTemplates(activeTemplates);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedTemplate) {
    return (
      <FormFilling
        template={selectedTemplate}
        employees={employees}
        onBack={() => setSelectedTemplate(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Выберите тип заявления</CardTitle>
          <CardDescription>
            Выберите нужный шаблон заявления из списка ниже
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Нет доступных шаблонов заявлений</p>
              <p className="text-sm mt-2">
                Обратитесь в HR отдел для создания шаблонов
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
