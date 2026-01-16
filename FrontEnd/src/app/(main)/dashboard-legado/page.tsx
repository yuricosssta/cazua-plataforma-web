// "use client";

import { UserList } from '@/components/UserList';
import { UserProfile } from '@/components/UserProfile';

export default async function DashboardPage() {

  return (

    <div className="container mx-auto px-5 mb-10">
      <UserProfile />
      <UserList /> 
    </div>
  );
}