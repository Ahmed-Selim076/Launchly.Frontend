import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../environments/environment';

// ─── DTOs (mirrors SuperAdminDTOs.cs) ─────────────────────────────────────────

interface TenantListItemDto {
  id:           string;
  name:         string;
  subdomain:    string;
  storeType:    string;
  planType:     string;
  isActive:     boolean;
  totalUsers:   number;
  totalOrders:  number;
  totalRevenue: number;
  createdAt:    string;
}

interface PagedResult<T> {
  items:      T[];
  totalCount: number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string | null;
  errors:  string[] | null;
}

const AVATAR_PALETTE = ['#7C6CF6', '#4FD1C5', '#F6AD55', '#FC8181', '#63B3ED', '#B794F4'];

/**
 * Super Admin — Tenants list (/tenants)
 *
 * Endpoint: GET  ${environment.apiUrl}/v1/super/tenants
 * Endpoint: PATCH ${environment.apiUrl}/v1/super/tenants/{id}/status
 *
 * Same working search/filter/pagination logic as before — this pass is a
 * visual rebuild (new sup-x / supa tokens instead of the tenant admin's
 * ad-x palette) plus one new bit of real interactivity: toggling a
 * tenant's active/suspended status directly from the row, instead of only
 * being able to view it. Also fixes a leftover placeholder domain in the
 * subdomain display ("storify.com" — not this platform's actual domain).
 */
@Component({
  selector: 'app-super-tenants',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-5 lg:px-8 py-8 max-w-7xl mx-auto">

      <!-- Filters row -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <p class="text-sup-text-3 text-sm mr-auto">
          @if (!isLoading() && !loadError()) {
            <span class="text-sup-text-1 font-semibold font-mono">{{ totalCount() | number }}</span>
            tenant{{ totalCount() === 1 ? '' : 's' }} total
          } @else {
            Platform tenants
          }
        </p>

        <!-- Search -->
        <div class="relative flex-1 max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sup-text-3"
               fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or subdomain…"
            [ngModel]="searchInput()"
            (ngModelChange)="onSearchChange($event)"
            class="w-full pl-9 pr-4 py-2 rounded-lg bg-sup-surface border border-sup-border
                   text-sup-text-1 text-sm placeholder:text-sup-text-3
                   focus:outline-none focus:border-supa transition-colors"
          />
        </div>

        <!-- Status filter -->
        <div class="flex gap-1 p-1 bg-sup-surface rounded-lg border border-sup-border">
          @for (opt of statusOptions; track opt.value) {
            <button
              type="button"
              (click)="setStatusFilter(opt.value)"
              class="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
              [class.bg-sup-surface-2]="statusFilter() === opt.value"
              [class.text-sup-text-1]="statusFilter() === opt.value"
              [class.text-sup-text-3]="statusFilter() !== opt.value"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      <!-- Table card -->
      <div class="rounded-2xl border border-sup-border bg-sup-surface overflow-hidden">

        <!-- Loading skeleton -->
        @if (isLoading()) {
          <div class="divide-y divide-sup-border">
            @for (_ of skeletonArr; track $index) {
              <div class="flex items-center gap-4 px-6 py-4">
                <div class="w-9 h-9 rounded-full bg-sup-surface-2 animate-pulse shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 bg-sup-surface-2 rounded animate-pulse w-48"></div>
                  <div class="h-3 bg-sup-surface-2 rounded animate-pulse w-32"></div>
                </div>
                <div class="h-3 bg-sup-surface-2 rounded animate-pulse w-20"></div>
                <div class="h-5 bg-sup-surface-2 rounded-full animate-pulse w-16"></div>
              </div>
            }
          </div>
        }

        <!-- Error -->
        @if (!isLoading() && loadError()) {
          <div class="flex flex-col items-center gap-3 py-20 text-center">
            <svg class="w-8 h-8 text-sup-text-3" fill="none" stroke="currentColor"
                 stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p class="text-sup-text-3 text-sm">{{ loadError() }}</p>
            <button type="button" (click)="load()"
                    class="text-xs font-semibold text-supa-light hover:text-supa transition-colors">
              Try again
            </button>
          </div>
        }

        <!-- Empty -->
        @if (!isLoading() && !loadError() && tenants().length === 0) {
          <div class="flex flex-col items-center gap-3 py-20 text-center">
            <svg class="w-8 h-8 text-sup-text-3" fill="none" stroke="currentColor"
                 stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>
            </svg>
            <p class="text-sup-text-3 text-sm">No tenants found</p>
            @if (searchInput() || statusFilter() !== null) {
              <button type="button" (click)="clearFilters()"
                      class="text-xs font-semibold text-supa-light hover:text-supa transition-colors">
                Clear filters
              </button>
            }
          </div>
        }

        <!-- Table -->
        @if (!isLoading() && !loadError() && tenants().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-sup-border">
                  <th class="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Tenant</th>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Store Type</th>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Plan</th>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Status</th>
                  <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Users</th>
                  <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Orders</th>
                  <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Revenue</th>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sup-text-3">Joined</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sup-border">
                @for (tenant of tenants(); track tenant.id; let i = $index) {
                  <tr
                    [routerLink]="['/super/tenants', tenant.id]"
                    class="hover:bg-sup-surface-2 cursor-pointer transition-colors group"
                  >
                    <!-- Name + subdomain -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          [style.background]="avatarColor(i)"
                        >
                          {{ tenant.name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                          <p class="font-semibold text-sup-text-1 group-hover:text-supa-light transition-colors truncate">
                            {{ tenant.name }}
                          </p>
                          <p class="text-sup-text-3 text-xs font-mono truncate">
                            /store/{{ tenant.subdomain }}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td class="px-4 py-4 text-sup-text-2">{{ tenant.storeType }}</td>

                    <td class="px-4 py-4">
                      <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            [class.bg-supa]="tenant.planType === 'Pro'"
                            [class.text-white]="tenant.planType === 'Pro'"
                            [class.bg-sup-surface-2]="tenant.planType !== 'Pro'"
                            [class.text-sup-text-3]="tenant.planType !== 'Pro'">
                        {{ tenant.planType }}
                      </span>
                    </td>

                    <!-- Status — clickable toggle -->
                    <td class="px-4 py-4">
                      <button
                        type="button"
                        (click)="toggleStatus(tenant, $event)"
                        [disabled]="togglingId() === tenant.id"
                        class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full
                               transition-opacity hover:opacity-75 disabled:opacity-50"
                        [class]="tenant.isActive ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'"
                        [title]="tenant.isActive ? 'Click to suspend' : 'Click to reactivate'"
                      >
                        <span class="w-1.5 h-1.5 rounded-full"
                              [class.bg-emerald-400]="tenant.isActive"
                              [class.bg-red-400]="!tenant.isActive"></span>
                        {{ tenant.isActive ? 'Active' : 'Suspended' }}
                      </button>
                    </td>

                    <td class="px-4 py-4 text-right text-sup-text-2 tabular-nums font-mono">{{ tenant.totalUsers | number }}</td>
                    <td class="px-4 py-4 text-right text-sup-text-2 tabular-nums font-mono">{{ tenant.totalOrders | number }}</td>
                    <td class="px-4 py-4 text-right font-semibold text-sup-text-1 tabular-nums font-mono">
                      {{ '$' + (tenant.totalRevenue | number:'1.0-0') }}
                    </td>
                    <td class="px-4 py-4 text-sup-text-3 text-xs whitespace-nowrap">
                      {{ tenant.createdAt | date:'MMM d, y' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-6 py-4 border-t border-sup-border">
              <p class="text-xs text-sup-text-3">
                Showing {{ pageStart() }}–{{ pageEnd() }} of {{ totalCount() | number }}
              </p>
              <div class="flex items-center gap-1">
                <button type="button" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-sup-text-3
                               hover:bg-sup-surface-2 hover:text-sup-text-1 disabled:opacity-40 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                @for (p of pageNumbers(); track p) {
                  @if (p === -1) {
                    <span class="w-8 h-8 flex items-center justify-center text-sup-text-3 text-xs">…</span>
                  } @else {
                    <button type="button" (click)="goToPage(p)"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors font-mono"
                            [class.bg-supa]="p === currentPage()"
                            [class.text-white]="p === currentPage()"
                            [class.text-sup-text-3]="p !== currentPage()"
                            [class.hover:bg-sup-surface-2]="p !== currentPage()"
                            [class.hover:text-sup-text-1]="p !== currentPage()">
                      {{ p }}
                    </button>
                  }
                }
                <button type="button" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-sup-text-3
                               hover:bg-sup-surface-2 hover:text-sup-text-1 disabled:opacity-40 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class SuperTenantsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly platformDomain = environment.platformDomain.replace(/:\d+$/, '');

  readonly isLoading   = signal(true);
  readonly loadError   = signal<string | null>(null);
  readonly tenants     = signal<TenantListItemDto[]>([]);
  readonly totalCount  = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages  = signal(1);
  readonly togglingId  = signal<string | null>(null);

  readonly searchInput  = signal('');
  readonly statusFilter = signal<boolean | null>(null);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private readonly PAGE_SIZE = 20;

  readonly pageStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.PAGE_SIZE + 1
  );
  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.PAGE_SIZE, this.totalCount())
  );

  readonly pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  readonly statusOptions = [
    { label: 'All',       value: null  as boolean | null },
    { label: 'Active',    value: true  as boolean | null },
    { label: 'Suspended', value: false as boolean | null },
  ];

  readonly skeletonArr = [0, 1, 2, 3, 4, 5, 6, 7];

  ngOnInit(): void {
    this.load();
  }

  avatarColor(index: number): string {
    return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    let params = new HttpParams()
      .set('page',     this.currentPage().toString())
      .set('pageSize', this.PAGE_SIZE.toString());

    const search = this.searchInput().trim();
    if (search) params = params.set('search', search);

    const status = this.statusFilter();
    if (status !== null) params = params.set('isActive', status.toString());

    this.http
      .get<ApiResponse<PagedResult<TenantListItemDto>>>(
        `${environment.apiUrl}/v1/super/tenants`,
        { params }
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.tenants.set(res.data.items);
            this.totalCount.set(res.data.totalCount);
            this.totalPages.set(res.data.totalPages);
          } else {
            this.loadError.set(res.message ?? 'Failed to load tenants.');
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.loadError.set('Could not reach the server. Please try again.');
        },
      });
  }

  /** Toggles a tenant's active/suspended status directly from the list —
   *  previously the status column was read-only and you had to open the
   *  tenant detail page just to flip this one flag. */
  toggleStatus(tenant: TenantListItemDto, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.togglingId()) return;

    const nextActive = !tenant.isActive;
    this.togglingId.set(tenant.id);

    this.http
      .patch<ApiResponse<boolean>>(
        `${environment.apiUrl}/v1/super/tenants/${tenant.id}/status`,
        { isActive: nextActive }
      )
      .subscribe({
        next: res => {
          this.togglingId.set(null);
          if (res.success) {
            this.tenants.update(list =>
              list.map(t => t.id === tenant.id ? { ...t, isActive: nextActive } : t)
            );
          }
        },
        error: () => this.togglingId.set(null),
      });
  }

  onSearchChange(value: string): void {
    this.searchInput.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(1);
      this.load();
    }, 400);
  }

  setStatusFilter(value: boolean | null): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  clearFilters(): void {
    this.searchInput.set('');
    this.statusFilter.set(null);
    this.currentPage.set(1);
    this.load();
  }
}
