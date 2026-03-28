// src/app/(main)/account/settings/page.tsx
"use client";

import React from "react";
import { ProjectsList } from "@/components/dashboard/ProjectsList";

export default function ProjectsPage() {
  

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      <ProjectsList />
    </div>
  );
}