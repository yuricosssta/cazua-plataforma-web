//src/components/dashboard/PersonalTasksPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus, ListTodo, CalendarClock, CheckSquare, Square } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export function PersonalTasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Buscando a identidade de quem está logado via Redux
  const currentOrg = useSelector(selectCurrentOrg);
  const user = useSelector((state: RootState) => state.auth.user);

  const userId = user?.sub || (user as any)?._id || (user as any)?.id || "unknown_user";
  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId || "unknown_org";

  // 2. Chave de Storage Blindada (Isolamento por Empresa e Usuário)
  const storageKey = `@cazua:tasks_${orgId}_${userId}`;

  // Carrega as tarefas usando a chave dinâmica
  useEffect(() => {
    if (!orgId || !userId) return;

    const savedTasks = localStorage.getItem(storageKey);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks([]); // Limpa a tela se o novo usuário não tiver tarefas
    }
    
    setIsLoaded(true);

    const handleStorageChange = () => {
      const updated = localStorage.getItem(storageKey);
      if (updated) setTasks(JSON.parse(updated));
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [storageKey, orgId, userId]);

  // Salva no LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [tasks, isLoaded, storageKey]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setNewTaskText("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const activeTasksCount = tasks.filter(t => !t.completed).length;

  if (!isLoaded) return <div className="h-[350px] bg-card border border-border rounded-sm shadow-sm animate-pulse" />;

  return (
    <div className="bg-card border border-border rounded-sm shadow-sm flex flex-col h-[350px] overflow-hidden">
      
      {/* Cabeçalho (Design Sóbrio) */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 uppercase">
            <ListTodo className="w-4 h-4 text-muted-foreground" />
            Minhas Tarefas
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTasksCount === 0 
              ? "Nenhuma pendência ativa." 
              : `${activeTasksCount} pendência${activeTasksCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Input de Nova Tarefa (Minimalista) */}
      <div className="p-3 border-b border-border bg-background">
        <form onSubmit={handleAddTask} className="relative flex items-center gap-2">
          <input
            type="text"
            placeholder="Nova anotação..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!newTaskText.trim()}
            className="h-9 px-3 flex items-center justify-center bg-secondary text-secondary-foreground border border-border rounded-md hover:bg-secondary/80 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Lista de Tarefas (Clean) */}
      <div className="flex-1 overflow-y-auto p-3 bg-muted/5 space-y-1.5 scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-2 pb-5">
            <CalendarClock className="w-8 h-8 stroke-[1.5]" />
            <p className="text-xs font-medium">Lista vazia.</p>
          </div>
        ) : (
          tasks
            .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt)
            .map((task) => (
            <div 
              key={task.id} 
              className={`group flex items-start gap-3 p-2.5 rounded-md transition-all ${task.completed ? 'opacity-50' : 'bg-background border border-border hover:border-muted-foreground/30 shadow-sm'}`}
            >
              <button onClick={() => toggleTask(task.id)} className="mt-0.5 flex-shrink-0 focus:outline-none text-muted-foreground hover:text-foreground transition-colors">
                {task.completed ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              
              <span className={`flex-1 text-xs leading-relaxed transition-all ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {task.text}
              </span>

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-all focus:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}