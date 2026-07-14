import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TenantService } from '../tenant/tenant.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { UserRole, StoreType } from '../models';

/** Redirects to /login if not authenticated */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

/** Requires TenantAdmin role */
export const tenantAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(UserRole.TenantAdmin)) return true;
  return router.createUrlTree(['/login']);
};

/** Requires SuperAdmin role */
export const superAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(UserRole.SuperAdmin)) return true;
  return router.createUrlTree(['/login']);
};

/** Requires Customer role */
export const customerGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(UserRole.Customer)) return true;
  return router.createUrlTree(['/login']);
};

/** Requires tenant.storeType === Ecommerce */
export const ecommerceGuard: CanActivateFn = () => {
  const tenant = inject(TenantService);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (tenant.currentTenant()?.storeType === StoreType.Ecommerce) return true;
  toast.error("This page isn't available for your store type.");
  return router.createUrlTree(['/admin/dashboard']);
};

/** Requires tenant.storeType === Booking */
export const bookingGuard: CanActivateFn = () => {
  const tenant = inject(TenantService);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (tenant.currentTenant()?.storeType === StoreType.Booking) return true;
  toast.error("This page isn't available for your store type.");
  return router.createUrlTree(['/admin/dashboard']);
};

/** Requires tenant.storeType === Restaurant */
export const restaurantGuard: CanActivateFn = () => {
  const tenant = inject(TenantService);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (tenant.currentTenant()?.storeType === StoreType.Restaurant) return true;
  toast.error("This page isn't available for your store type.");
  return router.createUrlTree(['/admin/dashboard']);
};
