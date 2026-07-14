import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from '../tenant/tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tenantService = inject(TenantService);
  const subdomain     = tenantService.getSubdomain();

  if (subdomain && subdomain !== 'admin') {
    const tenantReq = req.clone({
      setHeaders: { 'X-Tenant-Subdomain': subdomain }
    });
    return next(tenantReq);
  }

  return next(req);
};
