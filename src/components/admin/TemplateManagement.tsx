import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { FormTemplate } from "../../types";
import { templateAPI } from "../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { TemplateEditor } from "./TemplateEditor";

export function TemplateManagement() {
  const { templates, setTemplates, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateAPI.getAll();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить шаблоны",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    const now = new Date().toISOString();
    const newTemplate: FormTemplate = {
      id: crypto.randomUUID(),
      name: "Новый шаблон",
      description: "Описание шаблона",
      fields: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    setEditingTemplate(newTemplate);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (template: FormTemplate) => {
    try {
      const isNew = !templates.find((t) => t.id === template.id);

      if (isNew) {
        await templateAPI.add(template);
        addTemplate(template);
        toast({
          title: "Успешно",
          description: "Шаблон создан",
        });
      } else {
        await templateAPI.update(template.id, template);
        updateTemplate(template.id, template);
        toast({
          title: "Успешно",
          description: "Шаблон обновлен",
        });
      }

      setShowEditor(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить шаблон",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот шаблон?")) {
      return;
    }

    try {
      await templateAPI.delete(id);
      deleteTemplate(id);
      toast({
        title: "Успешно",
        description: "Шаблон удален",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить шаблон",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (template: FormTemplate) => {
    try {
      const updated = { ...template, isActive: !template.isActive, updatedAt: new Date().toISOString() };
      await templateAPI.update(template.id, updated);
      updateTemplate(template.id, updated);
      toast({
        title: "Успешно",
        description: template.isActive ? "Шаблон скрыт" : "Шаблон активирован",
      });
    } catch (error) {
      console.error("Error toggling template:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус шаблона",
        variant: "destructive",
      });
    }
  };

  if (showEditor && editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

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
              <CardTitle>Управление шаблонами форм</CardTitle>
              <CardDescription>
                Создавайте и редактируйте шаблоны заявлений
              </CardDescription>
            </div>
            <Button onClick={handleCreateTemplate} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать шаблон
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет шаблонов форм</p>
              <p className="text-sm mt-2">Создайте первый шаблон</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className={!template.isActive ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          {template.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Активен
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              Скрыт
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Полей: {template.fields.length}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(template)}
                          title={template.isActive ? "Скрыть шаблон" : "Активировать шаблон"}
                        >
                          {template.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
