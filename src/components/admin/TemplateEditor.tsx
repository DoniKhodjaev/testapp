import { useState } from "react";
import { FormTemplate, FormField } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, X } from "lucide-react";

interface TemplateEditorProps {
  template: FormTemplate;
  onSave: (template: FormTemplate) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [fields, setFields] = useState<FormField[]>(template.fields);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const handleAddField = () => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      name: `field_${fields.length + 1}`,
      label: "Новое поле",
      type: "text",
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
    setEditingField(newField);
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    if (editingField?.id === id) {
      setEditingField({ ...editingField, ...updates });
    }
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (editingField?.id === id) {
      setEditingField(null);
    }
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

    // Обновляем order
    newFields.forEach((field, idx) => {
      field.order = idx;
    });

    setFields(newFields);
  };

  const handleSave = () => {
    const updatedTemplate: FormTemplate = {
      ...template,
      name,
      description,
      fields,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedTemplate);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Редактор шаблона</CardTitle>
              <CardDescription>
                Настройте поля для заявления
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="gap-2">
                <X className="w-4 h-4" />
                Отмена
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Название шаблона *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Заявление на отпуск"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Описание *</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание шаблона"
                rows={2}
              />
            </div>
          </div>

          {/* Список полей */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Поля формы</h3>
              <Button onClick={handleAddField} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить поле
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Список полей */}
              <div className="space-y-2">
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Нет полей</p>
                    <p className="text-sm mt-1">Добавьте первое поле</p>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <Card
                      key={field.id}
                      className={`cursor-pointer transition-all ${
                        editingField?.id === field.id
                          ? "border-primary ring-2 ring-primary/20"
                          : ""
                      }`}
                      onClick={() => setEditingField(field)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {field.type} {field.required && "• Обязательное"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(index, "up");
                              }}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(index, "down");
                              }}
                              disabled={index === fields.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(field.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Редактор поля */}
              <div>
                {editingField ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Настройки поля</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Название поля</Label>
                        <Input
                          value={editingField.label}
                          onChange={(e) =>
                            handleUpdateField(editingField.id, { label: e.target.value })
                          }
                          placeholder="Например: Дата начала"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Имя переменной</Label>
                        <Input
                          value={editingField.name}
                          onChange={(e) =>
                            handleUpdateField(editingField.id, {
                              name: e.target.value.replace(/[^a-z0-9_]/gi, "_"),
                            })
                          }
                          placeholder="start_date"
                        />
                        <p className="text-xs text-muted-foreground">
                          Только латиница, цифры и подчеркивание
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Тип поля</Label>
                        <Select
                          value={editingField.type}
                          onValueChange={(value) =>
                            handleUpdateField(editingField.id, {
                              type: value as FormField["type"],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Текст</SelectItem>
                            <SelectItem value="textarea">Многострочный текст</SelectItem>
                            <SelectItem value="date">Дата</SelectItem>
                            <SelectItem value="number">Число</SelectItem>
                            <SelectItem value="select">Выпадающий список</SelectItem>
                            <SelectItem value="employee">Выбор сотрудника</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Подсказка</Label>
                        <Input
                          value={editingField.placeholder || ""}
                          onChange={(e) =>
                            handleUpdateField(editingField.id, {
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Текст подсказки"
                        />
                      </div>

                      {editingField.type === "select" && (
                        <div className="space-y-2">
                          <Label>Варианты (по одному на строку)</Label>
                          <Textarea
                            value={editingField.options?.join("\n") || ""}
                            onChange={(e) =>
                              handleUpdateField(editingField.id, {
                                options: e.target.value.split("\n").filter((o) => o.trim()),
                              })
                            }
                            placeholder="Вариант 1&#10;Вариант 2&#10;Вариант 3"
                            rows={5}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="required"
                          checked={editingField.required}
                          onChange={(e) =>
                            handleUpdateField(editingField.id, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="required" className="cursor-pointer">
                          Обязательное поле
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Выберите поле для редактирования</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
