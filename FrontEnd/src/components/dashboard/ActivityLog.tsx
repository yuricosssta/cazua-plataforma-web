//src/components/dashboard/ActivityLog.tsx
"use client";

import React from "react";
import { Plus, Edit2, Trash2, UserPlus, FileText } from "lucide-react";

// 1. Tipagem exata do que o seu backend (NestJS) deverá retornar no futuro
export type ActivityType = "CREATE" | "UPDATE" | "DELETE" | "USER_JOINED";

export interface Activity {
  id: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: ActivityType;
}

// 2. Dados Fictícios (Mock) para visualização
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    user: { name: "Yuri Costa" },
    action: "adicionou um novo produto",
    target: "Cimento CP II 50kg",
    timestamp: "Há 5 minutos",
    type: "CREATE",
  },
  {
    id: "2",
    user: { name: "Carlos Eduardo" },
    action: "atualizou o status da venda",
    target: "Pedido #4021",
    timestamp: "Há 42 minutos",
    type: "UPDATE",
  },
  {
    id: "3",
    user: { name: "Ana Beatriz" },
    action: "entrou na organização",
    target: "Prefeitura",
    timestamp: "Há 2 horas",
    type: "USER_JOINED",
  },
  {
    id: "4",
    user: { name: "Yuri Costa" },
    action: "excluiu o documento",
    target: "Relatório_Financeiro_2025.pdf",
    timestamp: "Ontem às 14:30",
    type: "DELETE",
  },
];

// 3. Função auxiliar para renderizar o ícone correto baseado na ação
const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "CREATE":
      return <Plus className="w-4 h-4 text-emerald-500" />;
    case "UPDATE":
      return <Edit2 className="w-4 h-4 text-blue-500" />;
    case "DELETE":
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case "USER_JOINED":
      return <UserPlus className="w-4 h-4 text-purple-500" />;
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
};

export function ActivityLog() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Atividades Recentes
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitoramento em tempo real das ações da equipe no banco de dados.
        </p>
      </div>

      {/* Container do Log (Usa as cores do globals.css) */}
      <div className="flex-1 rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-0">
          <ul className="divide-y divide-border">
            {MOCK_ACTIVITIES.map((activity) => {
              const initials = activity.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <li
                  key={activity.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar Circular */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-sm border border-border">
                      {activity.user.avatarUrl ? (
                        <img
                          src={activity.user.avatarUrl}
                          alt={activity.user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    {/* Badge do Ícone da Ação */}
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>

                  {/* Detalhes da Ação */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="font-semibold">{activity.user.name}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>{" "}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.timestamp}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}