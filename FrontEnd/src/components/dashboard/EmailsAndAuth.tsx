"use client";

import React from "react";
import { useSelector } from "react-redux";
import { MoreHorizontal } from "lucide-react";

export function EmailsAndAuth() {
  // Indo buscar o email ao Redux para ficar dinâmico
  const user = useSelector((state: any) => state.auth?.user || state.user?.profile);
  const email = user?.email || "eng.yuricosta@gmail.com";

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Emails & Auth</h1>
      </div>

      <div className="flex flex-col space-y-6">
        
        {/* Seção 1: Emails */}
        <section>
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-semibold">Emails</h3>
            <button className="h-9 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm">
              Add an email
            </button>
          </div>

          {/* Listagem do Email Atual (Com as Badges da referência) */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-foreground">{email}</span>
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
                Primary
              </span>
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
                Used for sign-in
              </span>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent focus:outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </section>

        <div className="h-px bg-border w-full" />

        {/* Seção 2: Password */}
        <section className="flex items-center justify-between border-b border-border pb-6 pt-2">
          <div>
            <h3 className="text-sm font-semibold">Password</h3>
            <p className="text-xs text-muted-foreground mt-1">Set a password for your account</p>
          </div>
          <button className="h-9 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm">
            Set password
          </button>
        </section>

        {/* Seção 3: Passkey */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Passkey</h3>
            <p className="text-xs text-muted-foreground mt-1">Register a passkey</p>
          </div>
          <button className="h-9 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm">
            Add new passkey
          </button>
        </section>

        {/* Seção 4: MFA */}
        <section className="flex items-center justify-between pb-6">
          <div>
            <h3 className="text-sm font-semibold">Multi-factor authentication</h3>
            <p className="text-xs text-muted-foreground mt-1">Multi-factor authentication is currently disabled.</p>
          </div>
          <button className="h-9 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm">
            Enable MFA
          </button>
        </section>

      </div>
    </div>
  );
}