import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthPayload } from '../../../common/tenancy/tenant-context.middleware';

/** Injects the authenticated user payload (or a specific field) into a handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const auth = request.auth;
    if (!auth) {
      return undefined;
    }
    return data ? auth[data] : auth;
  },
);
