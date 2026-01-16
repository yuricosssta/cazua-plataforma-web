"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
// import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/redux/slices/authSlice";
import { useSelector } from "react-redux";

export function PageClient() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // const teams = user.useTeams();
  const [teamDisplayName, setTeamDisplayName] = React.useState("");
  const user = useSelector(selectCurrentUser);

  //TIMES DO USUÁRIO MOKADOS
  //cria times para teste
  
    const teams = [
      { id: 'team1', displayName: 'Team One' },
      { id: 'team2', displayName: 'Team Two'}
    ];
    console.log("User teams:", teams);
    
  
  
  // const teams = isAuthenticated && user ? [
  //   { id: 'team1', displayName: 'Team One' },
  //   { id: 'team2', displayName: 'Team Two' }
  // ] : [];

  

  // Seleciona o time padrão se nenhum estiver selecionado 
  //se o usuário não tiver time, redireciona para criação de time
  // React.useEffect(() => {
  //   if (!user) return;
  //   // if (teams.length > 0 && !user.selectedTeam) {
  //   if (teams.length > 0 && !user.selectedTeam) {
  //     user.setSelectedTeam(teams[0]);
  //   }
  // }, [teams, user]);


  if (user) {
    if (teams.length === 0) {
      return (
        <div className="flex items-center justify-center h-screen w-screen">
          <div className="max-w-xs w-full">
            <h1 className="text-center text-2xl font-semibold">Welcome!</h1>
            <p className="text-center text-gray-500">
              Create a team to get started
            </p>
            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                user.createTeam({ displayName: teamDisplayName });
              }}
            >
              <div>
                <Label className="text-sm">Team name</Label>
                <Input
                  placeholder="Team name"
                  value={teamDisplayName}
                  onChange={(e) => setTeamDisplayName(e.target.value)}
                />
              </div>
              <Button className="mt-4 w-full">Create team</Button>
            </form>
          </div>
        </div>
      );
    } else if (user.selectedTeam) {
      // router.push(`/dashboard/${user.selectedTeam.id}`);
      router.push(`/dashboard/${teams[0].id}`);
    }
  }

  return null;
}
