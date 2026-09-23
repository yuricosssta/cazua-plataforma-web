//src/lib/services/organizationService.ts
const BASE_URL = '/api';

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `Erro ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }
  return data;
}

export const apiFetchMyOrganizations = async (_token: string) => {
  const res = await fetch(`${BASE_URL}/organizations/my-orgs`);
  return handleResponse(res);
};

export const apiCreateOrganization = async (name: string, acronym: string) => {
  const res = await fetch(`${BASE_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, acronym }),
  });
  return handleResponse(res);
};

export const apiGetOrgMembers = async (orgId: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members`);
  return handleResponse(res);
};

export const apiCreateOrgMember = async (orgId: string, memberData: any) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  });
  return handleResponse(res);
};

export const apiUpdateOrgMemberRole = async (orgId: string, memberId: string, role: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members/${memberId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
};

export const apiRemoveOrgMember = async (orgId: string, memberId: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/members/${memberId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};
