//src/app/(main)/dashboard/settings/page.tsx
"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearOrganizationState } from "@/lib/redux/slices/organizationSlice";
import { DataManagement } from "@/components/dashboard/settings/DataManagement";
import { LogOut, Palette, X } from "lucide-react";
import { BrandingSettings } from "@/components/dashboard/settings/BrandingSettings";
import { StorageManagement } from "@/components/dashboard/settings/StorageManagement";

export default function StorageManagementPage() {
  const dispatch = useDispatch<AppDispatch>();


  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">

      {/* Cabeçalho */}
      <div className="border-b border-border pb-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustes globais do sistema e gestão de dados sensíveis.
        </p>
      </div>

      <div className="flex flex-col space-y-8">
        <DataManagement />
      </div>
    </div>
  );
}