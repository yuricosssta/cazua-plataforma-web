"use client";

import React from "react";
import { UserPlus, MoreHorizontal } from "lucide-react";

// Mock de membros (No futuro virá da API)
const MOCK_MEMBERS = [
  { id: "1", name: "Yuri Costa", email: "eng.yuricosta@gmail.com", role: "Owner", avatarUrl: "" },
  { id: "2", name: "Ana Beatriz", email: "ana.arquiteta@email.com", role: "Admin", avatarUrl: "" },
  { id: "3", name: "Carlos Engenharia", email: "carlos.eng@email.com", role: "Member", avatarUrl: "" },
];

export function OrganizationPeople() {
  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-8 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Membros</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Convide novos usuários e gerencie o acesso da sua equipe.
          </p>
        </div>
      </div>

      {/* Seção de Convites */}
      <div className="p-5 border border-border bg-card rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold">Convidar novo membro</h3>
          <p className="text-xs text-muted-foreground mt-1">Envie um convite por e-mail para adicionar alguém à equipe.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="email" 
            placeholder="E-mail do colaborador" 
            className="flex h-9 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button className="flex items-center gap-2 h-9 px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap shadow-sm">
            <UserPlus className="w-4 h-4" />
            Enviar Convite
          </button>
        </div>
      </div>

      {/* Tabela de Membros Ativos */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-semibold">Membros Ativos ({MOCK_MEMBERS.length})</h3>
        
        <div className="rounded-md border border-border overflow-hidden bg-card shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                <th className="px-4 py-3 font-medium">Função</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_MEMBERS.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold border border-border flex-shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <span className="font-medium text-foreground">{member.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {member.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      member.role === 'Owner' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}