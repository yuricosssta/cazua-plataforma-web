// src/app/(main)/account/settings/page.tsx
"use client";

import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearOrganizationState } from "@/lib/redux/slices/organizationSlice";

export default function GeneralSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    // A mesma lógica limpa e segura que fizemos no Header
    dispatch(logout());
    dispatch(clearOrganizationState());
    localStorage.removeItem('token'); 
    window.location.replace('/login');
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="flex flex-col space-y-6">
        
        {/* Seção Única: Sign out */}
        <section className="flex items-center justify-between border-b border-border pb-6 pt-2">
          <div>
            <h3 className="text-sm font-semibold">Sign out</h3>
            <p className="text-xs text-muted-foreground mt-1">End your current session</p>
          </div>
          <button 
            onClick={handleLogout}
            className="h-9 px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm"
          >
            Sign out
          </button>
        </section>

      </div>
    </div>
  );
}