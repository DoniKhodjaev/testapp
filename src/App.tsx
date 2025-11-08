import { useState, useEffect } from "react";
import { EmployeeView } from "./components/EmployeeView";
import { AdminView } from "./components/AdminView";
import { Button } from "./components/ui/button";
import { Shield, User } from "lucide-react";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">HR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Система управления заявлениями
                </h1>
                <p className="text-sm text-gray-500">
                  {isAdminMode ? "Панель администратора" : "Режим сотрудника"}
                </p>
              </div>
            </div>

            <Button
              variant={isAdminMode ? "default" : "outline"}
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="gap-2"
            >
              {isAdminMode ? (
                <>
                  <User className="w-4 h-4" />
                  Режим сотрудника
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Панель HR
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdminMode ? <AdminView /> : <EmployeeView />}
      </main>

      <Toaster />
    </div>
  );
}

export default App;
