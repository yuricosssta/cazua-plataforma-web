//src/lib/services/organizationService.ts
import { fetchBff } from '@/lib/api/fetchBff';

export const apiFetchMyOrganizations = async () => {
  return fetchBff('/api/organizations/my-orgs');
};

export const apiCreateOrganization = async (name: string, acronym: string) => {
  return fetchBff('/api/organizations', {
    method: 'POST',
    body: JSON.stringify({ name, acronym }),
  });
};

export const apiGetOrgMembers = async (orgId: string) => {
  return fetchBff(`/api/organizations/${orgId}/members`, {
    headers: { 'x-org-id': orgId },
  });
};

export const apiCreateOrgMember = async (orgId: string, memberData: any) => {
  return fetchBff(`/api/organizations/${orgId}/members`, {
    method: 'POST',
    headers: { 'x-org-id': orgId },
    body: JSON.stringify(memberData),
  });
};

export const apiUpdateOrgMemberRole = async (orgId: string, memberId: string, role: string) => {
  return fetchBff(`/api/organizations/${orgId}/members/${memberId}/role`, {
    method: 'PATCH',
    headers: { 'x-org-id': orgId },
    body: JSON.stringify({ role }),
  });
};

export const apiRemoveOrgMember = async (orgId: string, memberId: string) => {
  return fetchBff(`/api/organizations/${orgId}/members/${memberId}`, {
    method: 'DELETE',
    headers: { 'x-org-id': orgId },
  });
};