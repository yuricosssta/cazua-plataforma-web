// src/lib/api/clientUtils.ts
export function getClientApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  );
}