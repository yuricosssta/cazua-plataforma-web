// src/lib/projectHelpers.ts

export function getOrgId(currentOrg: any): string {
  if (!currentOrg?.organizationId) return "";
  if (
    typeof currentOrg.organizationId === "object" &&
    "_id" in currentOrg.organizationId
  ) {
    return (currentOrg.organizationId as any)._id;
  }
  return currentOrg.organizationId as string;
}

export function getUserSub(user: any): string {
  return String(
    user?.sub || (user as any)?._id || (user as any)?.id || ""
  );
}

export function isUserAssigned(
  assignedMembers: any[] | undefined,
  userId: string
): boolean {
  if (!assignedMembers || !userId || userId === "undefined") return false;

  return assignedMembers.some((m: any) => {
    if (typeof m === "string") return m === userId;
    if (m && typeof m === "object")
      return String(m._id || m.id || "") === userId;
    return false;
  });
}