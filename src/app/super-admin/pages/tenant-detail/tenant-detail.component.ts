import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';

import { ButtonComponent }    from '../../../shared/components/button/button.component';
import { BadgeComponent }     from '../../../shared/components/badge/badge.component';
import { SkeletonComponent }  from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

// ─── DTOs (mirrors SuperAdminDTOs.cs) ─────────────────────────────────────────

interface TenantDetailDto {
  id:            string;
  name:          string;
  subdomain:     string;
  storeType:     string;
  planType:      string;
  isActive:      boolean;
  logoUrl:       string | null;
  storeName:     string | null;
  totalUsers:    number;
  totalProducts: number;
  totalOrders:   number;
  totalRevenue:  number;
  createdAt:     string;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string | null;
  errors:  string[] | null;
}

/**
 * Phase 8 — Super Admin Panel
 * Tenant Detail page (/tenants/:id)
 *
 * Endpoints:
 *   GET   ${environment.apiUrl}/v1/super/tenants/:id
 *   PATCH ${environment.apiUrl}/v1/super/tenants/:id/status  { isActive: boolean }
 *
 * Auth: SuperAdmin JWT (set by auth interceptor).
 *
 * Features:
 *   - Full tenant metadata display (name, subdomain, storeType, plan, dates)
 *   - Key stats: Users, Products, Orders, Revenue
 *   - Activate / Suspend toggle with confirm step and loading state
 *   - Back link → /tenants
 *   - Loading skeleton, error state
 */
@Component({
  selector: 'app-super-tenant-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sup-bg text-sup-text-1">

      <!-- Page header -->
      <div class="border-b border-sup-border px-6 py-6">
        <div class="max-w-5xl mx-auto">
          <a routerLink="/super/tenants"
             class="inline-flex items-center gap-1.5 text-xs font-semibold
                    text-sup-text-3 hover:text-sup-text-1 transition-colors mb-4">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor"
                 stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            All Tenants
          </a>

          @if (isLoading()) {
            <div class="space-y-2">
              <app-skeleton [dark]="true" height="28px" width="240px" />
              <app-skeleton [dark]="true" height="16px" width="160px" />
            </div>
          } @else if (tenant()) {
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-4">
                <!-- Logo or initials -->
                @if (tenant()!.logoUrl) {
                  <img [src]="tenant()!.logoUrl" [alt]="tenant()!.name"
                       class="w-12 h-12 rounded-xl object-cover border border-sup-border"/>
                } @else {
                  <div class="w-12 h-12 rounded-xl bg-supa/15 flex items-center
                              justify-center shrink-0">
                    <span class="text-lg font-bold text-supa-light">
                      {{ tenant()!.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                }
                <div>
                  <h1 class="text-2xl font-bold text-sup-text-1 tracking-tight">
                    {{ tenant()!.name }}
                  </h1>
                  <p class="text-sup-text-3 text-sm mt-0.5">
                    /store/{{ tenant()!.subdomain }}
                  </p>
                </div>
              </div>

              <!-- Status badge + action -->
              <div class="flex items-center gap-3">
                <app-badge [variant]="tenant()!.isActive ? 'success' : 'danger'">
                  {{ tenant()!.isActive ? 'Active' : 'Suspended' }}
                </app-badge>

                @if (!confirmingToggle()) {
                  <app-button
                    [variant]="tenant()!.isActive ? 'danger' : 'primary'"
                    size="sm"
                    [loading]="isToggling()"
                    (clicked)="confirmingToggle.set(true)"
                  >
                    {{ tenant()!.isActive ? 'Suspend Tenant' : 'Activate Tenant' }}
                  </app-button>
                } @else {
                  <!-- Confirm step -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-sup-text-3">Are you sure?</span>
                    <app-button
                      [variant]="tenant()!.isActive ? 'danger' : 'primary'"
                      size="sm"
                      [loading]="isToggling()"
                      (clicked)="toggleStatus()"
                    >
                      {{ tenant()!.isActive ? 'Yes, Suspend' : 'Yes, Activate' }}
                    </app-button>
                    <app-button
                      variant="ghost"
                      size="sm"
                      [disabled]="isToggling()"
                      (clicked)="confirmingToggle.set(false)"
                    >
                      Cancel
                    </app-button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-6 py-8 space-y-8">

        <!-- Loading -->
        @if (isLoading()) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            @for (_ of [1,2,3,4]; track $index) {
              <app-skeleton [dark]="true" height="88px" />
            }
          </div>
          <div class="space-y-3">
            @for (_ of [1,2,3,4,5,6]; track $index) {
              <app-skeleton [dark]="true" height="20px" />
            }
          </div>
        }

        <!-- Error -->
        @if (!isLoading() && loadError()) {
          <app-empty-state
            icon="⚠️"
            title="Couldn't load tenant"
            [description]="loadError()!"
            actionLabel="Retry"
            [dark]="true"
            (actionClicked)="load()"
          />
        }

        <!-- Toggle error -->
        @if (toggleError()) {
          <div class="rounded-lg border border-danger/30 bg-danger-dim px-4 py-3
                      text-sm text-danger flex items-center justify-between">
            <span>{{ toggleError() }}</span>
            <button type="button" (click)="toggleError.set(null)"
                    class="text-danger/60 hover:text-danger transition-colors ml-4">
              ✕
            </button>
          </div>
        }

        <!-- Content -->
        @if (!isLoading() && !loadError() && tenant()) {

          <!-- Stats grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="rounded-xl border border-sup-border bg-sup-surface p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-sup-text-3 mb-1">
                Users
              </p>
              <p class="text-2xl font-bold text-sup-text-1 tabular-nums">
                {{ tenant()!.totalUsers | number }}
              </p>
            </div>
            <div class="rounded-xl border border-sup-border bg-sup-surface p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-sup-text-3 mb-1">
                {{ productLabel() }}
              </p>
              <p class="text-2xl font-bold text-sup-text-1 tabular-nums">
                {{ tenant()!.totalProducts | number }}
              </p>
            </div>
            <div class="rounded-xl border border-sup-border bg-sup-surface p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-sup-text-3 mb-1">
                Orders
              </p>
              <p class="text-2xl font-bold text-sup-text-1 tabular-nums">
                {{ tenant()!.totalOrders | number }}
              </p>
            </div>
            <div class="rounded-xl border border-sup-border bg-sup-surface p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-sup-text-3 mb-1">
                Revenue
              </p>
              <p class="text-2xl font-bold text-sup-text-1 tabular-nums">
                {{ '$' + (tenant()!.totalRevenue | number:'1.0-0') }}
              </p>
            </div>
          </div>

          <!-- Metadata card -->
          <div class="rounded-xl border border-sup-border bg-sup-surface overflow-hidden">
            <div class="px-6 py-4 border-b border-sup-border">
              <h2 class="text-sm font-semibold text-sup-text-1">Tenant Information</h2>
            </div>
            <dl class="divide-y divide-sup-border">

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Tenant ID</dt>
                <dd class="text-sm font-mono text-sup-text-2 col-span-2 truncate">
                  {{ tenant()!.id }}
                </dd>
              </div>

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Store Name</dt>
                <dd class="text-sm text-sup-text-1 col-span-2 font-medium">
                  {{ tenant()!.storeName || tenant()!.name }}
                </dd>
              </div>

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Subdomain</dt>
                <dd class="text-sm text-sup-text-2 col-span-2 font-mono">
                  /store/{{ tenant()!.subdomain }}
                </dd>
              </div>

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Store Type</dt>
                <dd class="text-sm text-sup-text-1 col-span-2">
                  {{ tenant()!.storeType }}
                </dd>
              </div>

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Plan</dt>
                <dd class="col-span-2">
                  <app-badge [variant]="tenant()!.planType === 'Pro' ? 'default' : 'default'">
                    {{ tenant()!.planType }}
                  </app-badge>
                </dd>
              </div>

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Status</dt>
                <dd class="col-span-2">
                  <app-badge [variant]="tenant()!.isActive ? 'success' : 'danger'">
                    {{ tenant()!.isActive ? 'Active' : 'Suspended' }}
                  </app-badge>
                </dd>
              </div>

              <div class="grid grid-cols-3 gap-4 px-6 py-4">
                <dt class="text-sm text-sup-text-3 col-span-1">Joined</dt>
                <dd class="text-sm text-sup-text-2 col-span-2">
                  {{ tenant()!.createdAt | date:'MMMM d, y, h:mm a' }}
                </dd>
              </div>

            </dl>
          </div>

        }
      </div>
    </div>
  `,
})
export class SuperTenantDetailComponent implements OnInit {
  private readonly http  = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly platformDomain = environment.platformDomain.replace(/:\d+$/, '');

  readonly isLoading       = signal(true);
  readonly loadError       = signal<string | null>(null);
  readonly tenant          = signal<TenantDetailDto | null>(null);
  readonly isToggling      = signal(false);
  readonly toggleError     = signal<string | null>(null);
  readonly confirmingToggle = signal(false);

  private tenantId = '';

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  /** GET ${environment.apiUrl}/v1/super/tenants/:id */
  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.http
      .get<ApiResponse<TenantDetailDto>>(
        `${environment.apiUrl}/v1/super/tenants/${this.tenantId}`
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.tenant.set(res.data);
          } else {
            this.loadError.set(res.message ?? 'Failed to load tenant.');
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.loadError.set('Could not reach the server. Please try again.');
        },
      });
  }

  /**
   * PATCH ${environment.apiUrl}/v1/super/tenants/:id/status
   * Body: { isActive: boolean }
   */
  toggleStatus(): void {
    const current = this.tenant();
    if (!current || this.isToggling()) return;

    const newStatus = !current.isActive;
    this.isToggling.set(true);
    this.toggleError.set(null);

    this.http
      .patch<ApiResponse<TenantDetailDto>>(
        `${environment.apiUrl}/v1/super/tenants/${this.tenantId}/status`,
        { isActive: newStatus }
      )
      .subscribe({
        next: (res) => {
          this.isToggling.set(false);
          this.confirmingToggle.set(false);
          if (res.success && res.data) {
            this.tenant.set(res.data);
          } else {
            this.toggleError.set(res.message ?? 'Failed to update status.');
          }
        },
        error: () => {
          this.isToggling.set(false);
          this.confirmingToggle.set(false);
          this.toggleError.set('Could not update tenant status. Please try again.');
        },
      });
  }

  /**
   * storeType-aware label for TotalProducts field.
   * TotalProducts is deliberately left as-is in the backend (noted in brief).
   * We surface it with a contextual label in the UI only.
   */
  productLabel(): string {
    const type = this.tenant()?.storeType?.toLowerCase() ?? '';
    if (type.includes('restaurant')) return 'Menu Items';
    if (type.includes('booking'))    return 'Services';
    return 'Products';
  }
}
