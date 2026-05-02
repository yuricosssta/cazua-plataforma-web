"use client";

import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { Edit2, AlertTriangle } from "lucide-react";

export function OrganizationSettings() {
  const currentOrg = useSelector(selectCurrentOrg);

  if (!currentOrg) {
    return <div className="animate-pulse h-32 bg-muted rounded-md w-full"></div>;
  }

  const orgName = currentOrg.organizationId.name;
  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Workspace</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerencie a identidade e as preferências da sua organização.
        </p>
      </div>

      <div className="flex flex-col space-y-8">
        {/* Identidade Visual */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Logo da Equipe</h3>
            <p className="text-xs text-muted-foreground mt-1">Faça o upload de uma imagem para representar a organização</p>
          </div>
          <button className="flex items-center justify-center w-12 h-12 rounded-full bg-muted border border-border hover:ring-2 hover:ring-ring transition-all cursor-pointer">
            <span className="font-bold text-muted-foreground">{initial}</span>
          </button>
        </section>

        {/* Nome da Organização */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Nome da Organização</h3>
            <p className="text-xs text-muted-foreground mt-1">Altere o nome de exibição oficial da sua equipe</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
            {orgName} <Edit2 className="w-4 h-4" />
          </button>
        </section>

        {/* Nome do Usuário no Contexto do Time */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Seu apelido na equipe</h3>
            <p className="text-xs text-muted-foreground mt-1">Sobrescreva seu nome de exibição especificamente para este workspace</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
            Yuri Costa <Edit2 className="w-4 h-4" />
          </button>
        </section>

        {/* Zona de Perigo (Danger Zone) */}
        <section className="pt-4">
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Zona de Perigo
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <p className="text-xs text-muted-foreground">
                Sair desta equipe removerá seu acesso a todos os projetos e dados vinculados a ela.
              </p>
              <button className="h-9 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors whitespace-nowrap shadow-sm">
                Sair da Equipe
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


// "use client";

// import React from "react";
// import { useSelector } from "react-redux";
// import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
// import { Edit2 } from "lucide-react";

// // Mock de membros
// const MOCK_MEMBERS = [
//   { id: "1", name: "Yuri Costa", email: "eng.yuricosta@gmail.com", role: "Owner", avatarUrl: "" },
// ];

// export function OrganizationSettings() {
//   const currentOrg = useSelector(selectCurrentOrg);

//   // Fallback caso a página carregue antes do Redux
//   if (!currentOrg) {
//     return <div className="animate-pulse h-32 bg-muted rounded-md w-full"></div>;
//   }

//   const orgName = currentOrg.organizationId.name;
//   const initial = orgName.charAt(0).toUpperCase();

//   return (
//     <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
//       {/* Cabeçalho */}
//       <div className="flex items-center gap-3 border-b border-border pb-6">
//         <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md font-bold text-sm">
//           {initial}
//         </div>
//         <h1 className="text-xl font-bold tracking-tight">{orgName}</h1>
//       </div>

//       {/* Seção 1: Team user name */}
//       <section className="flex items-center justify-between border-b border-border pb-6">
//         <div>
//           <h3 className="text-sm font-semibold">Usuários cadastrados</h3>
//           <p className="text-xs text-muted-foreground mt-1">Overwrite your user display name in this team</p>
//         </div>
//         <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
//           Yuri Costa <Edit2 className="w-4 h-4" />
//         </button>
//       </section>

//       {/* Seção 2: Members */}
//       <section className="flex flex-col gap-4 border-b border-border pb-6">
//         <h3 className="text-sm font-semibold">Members</h3>
//         <div className="rounded-md border border-border overflow-hidden">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-muted/50 text-muted-foreground text-xs">
//               <tr>
//                 <th className="px-4 py-3 font-medium">User</th>
//                 <th className="px-4 py-3 font-medium">Name</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-border bg-card">
//               {MOCK_MEMBERS.map((member) => (
//                 <tr key={member.id} className="hover:bg-muted/30 transition-colors">
//                   <td className="px-4 py-3 flex items-center gap-3">
//                     <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold border border-border">
//                       {member.avatarUrl ? (
//                         <img src={member.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
//                       ) : (
//                         member.name.charAt(0)
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </section>

//       {/* Seção 3: Invite member */}
//       <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
//         <div className="flex-1">
//           <h3 className="text-sm font-semibold">Invite member</h3>
//           <p className="text-xs text-muted-foreground mt-1">Invite a user to your team through email</p>
//         </div>
//         <div className="flex items-center gap-3 w-full sm:w-auto">
//           <input 
//             type="email" 
//             placeholder="Email" 
//             className="flex h-9 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//           />
//           <button className="h-9 px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap shadow-sm">
//             Invite User
//           </button>
//         </div>
//       </section>

//       {/* Seção 4: Team profile image */}
//       <section className="flex items-center justify-between border-b border-border pb-6">
//         <div>
//           <h3 className="text-sm font-semibold">Team profile image</h3>
//           <p className="text-xs text-muted-foreground mt-1">Upload an image for your team</p>
//         </div>
//         <button className="flex items-center justify-center w-12 h-12 rounded-full bg-muted border border-border hover:ring-2 hover:ring-ring transition-all cursor-pointer">
//           <span className="font-bold text-muted-foreground">{initial}R</span>
//         </button>
//       </section>

//       {/* Seção 5: Team display name */}
//       <section className="flex items-center justify-between border-b border-border pb-6">
//         <div>
//           <h3 className="text-sm font-semibold">Team display name</h3>
//           <p className="text-xs text-muted-foreground mt-1">Change the display name of your team</p>
//         </div>
//         <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
//           {orgName} <Edit2 className="w-4 h-4" />
//         </button>
//       </section>

//       {/* Seção 6: Leave Team (Danger Zone) */}
//       <section className="flex items-center justify-between pt-2">
//         <div>
//           <h3 className="text-sm font-semibold">Leave Team</h3>
//           <p className="text-xs text-muted-foreground mt-1">leave this team and remove your team profile</p>
//         </div>
//         <button className="h-9 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors">
//           Leave team
//         </button>
//       </section>

//     </div>
//   );
// }