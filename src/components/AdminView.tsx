import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Users, FileText } from "lucide-react";
import { EmployeeManagement } from "./admin/EmployeeManagement";
import { TemplateManagement } from "./admin/TemplateManagement";

export function AdminView() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" />
            Сотрудники
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Шаблоны форм
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeManagement />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
