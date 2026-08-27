import { SetMetadata } from '@nestjs/common';
import { AUTH_ROLES_KEY, AuthRole } from '../guards/auth.guard';

export const RequireRole = (...roles: AuthRole[]) => SetMetadata(AUTH_ROLES_KEY, roles);
