"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Edit2, User } from "lucide-react";
import { RootState } from "@/lib/redux/store";

export function MyProfile() {
  // Indo buscar os dados do utilizador ao Redux (ajuste o seletor conforme o seu state real)
  const user = useSelector((state: any) => state.auth?.user || state.user?.profile);

  // Fallbacks caso os dados ainda estejam a carregar
  const userName = user?.name || "Yuri Costa";
  const userAvatar = user?.avatarUrl || "";

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
      </div>

      <div className="flex flex-col space-y-8">
        
        {/* Seção 1: User name */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">User name</h3>
            <p className="text-xs text-muted-foreground mt-1">
              This is a display name and is not used for authentication
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
            {userName} <Edit2 className="w-4 h-4" />
          </button>
        </section>

        {/* Seção 2: Profile image */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Profile image</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your own image as your avatar
            </p>
          </div>
          
          <button className="flex items-center justify-center w-12 h-12 rounded-full bg-accent border border-border hover:ring-2 hover:ring-ring transition-all overflow-hidden cursor-pointer focus:outline-none">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </section>

      </div>
    </div>
  );
}