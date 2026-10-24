import { SelfOrSuperAdminGuard } from './self-or-super-admin.guard';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

describe('SelfOrSuperAdminGuard', () => {
  let guard: SelfOrSuperAdminGuard;
  let mockConfigService: Partial<ConfigService>;

  const validTargetId = new Types.ObjectId().toString();
  const differentValidId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'SUPER_ADMIN_EMAIL') return 'admin@cazua.com';
        return null;
      }),
    };
    guard = new SelfOrSuperAdminGuard(mockConfigService as ConfigService);
  });

  const createMockContext = (user: any, params: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw BadRequestException if userId param is not a valid ObjectId', () => {
    const ctx = createMockContext(
      { sub: validTargetId },
      { userId: 'invalid-id' },
    );
    expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
  });

  it('should allow if user is modifying their own account', () => {
    const ctx = createMockContext(
      { sub: validTargetId },
      { userId: validTargetId },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow if requester is Super Admin modifying another user', () => {
    const ctx = createMockContext(
      { sub: differentValidId, isSuperAdmin: true },
      { userId: validTargetId },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if requester is a regular user trying to modify another account', () => {
    const ctx = createMockContext(
      { sub: differentValidId, isSuperAdmin: false },
      { userId: validTargetId },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
