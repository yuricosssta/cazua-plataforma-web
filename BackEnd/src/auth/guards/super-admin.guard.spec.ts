import { SuperAdminGuard } from './super-admin.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'SUPER_ADMIN_EMAIL') return 'admin@cazua.com';
        return null;
      }),
    };
    guard = new SuperAdminGuard(mockConfigService as ConfigService);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw ForbiddenException if user is not authenticated', () => {
    const ctx = createMockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow if user has isSuperAdmin === true', () => {
    const ctx = createMockContext({ email: 'other@example.com', isSuperAdmin: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow if user email matches SUPER_ADMIN_EMAIL', () => {
    const ctx = createMockContext({ email: 'admin@cazua.com', isSuperAdmin: false });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if user is neither isSuperAdmin nor super admin email', () => {
    const ctx = createMockContext({ email: 'user@example.com', isSuperAdmin: false });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
