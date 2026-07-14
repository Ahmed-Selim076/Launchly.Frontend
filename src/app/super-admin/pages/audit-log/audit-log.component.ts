import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../../environments/environment';

import { ButtonComponent }     from '../../../shared/components/button/button.component';
import { BadgeComponent }      from '../../../shared/components/badge/badge.component';
import { SkeletonComponent }   from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

// ─── DTOs (mirrors SuperAdminDTOs.cs) ─────────────────────────────────────────

interface SuperAuditLogDto {
  id:          string;
  tenantName:  string | null;
  userEmail:   string;
  action:      string;
  entityType:  string | null;
  entityId:    string | null;
  details:     string | null;
  ipAddress:   string | null;
  createdAt:   string;
}

interface SuperAuditLogListDto {
  items:      SuperAuditLogDto[];
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

const ACTION_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  Created: 'success',
  Updated: 'default',
  Deleted: 'danger',
};

const ACTION_ICON: Record<string, string> = {
  Created: '✚',
  Updated: '✎',
  Deleted: '✕',
};

/**
 * Phase 8 — Super Admin Panel
 * Platform Audit Log page (/audit-log)
 *
 * Endpoint: GET ${environment.apiUrl}/v1/super/audit-log?page=&pageSize=
 * Auth: SuperAdmin JWT (set by auth interceptor).
 *
 * Mirrors the tenant-level AuditLogComponent pattern (ground truth) but
 * adds TenantName column — platform-wide logs show which tenant each
 * action belongs to.
 */
@Component({
  selector: 'app-super-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-5 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">

      <p class="text-sup-text-3 text-sm">
        @if (!isLoading() && !loadError() && result()) {
          <span class="text-sup-text-1 font-semibold font-mono">{{ result()!.totalCount | number }}</span>
          event{{ result()!.totalCount !== 1 ? 's' : '' }} recorded across all tenants
        } @else {
          Platform-wide activity log
        }
      </p>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="space-y-2">
            @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
              <app-skeleton [dark]="true" height="60px" />
            }
          </div>
        }

        <!-- Error -->
        @if (!isLoading() && loadError()) {
          <app-empty-state
            icon="⚠️"
            title="Couldn't load audit log"
            [description]="loadError()!"
            actionLabel="Retry"
            [dark]="true"
            (actionClicked)="load()"
          />
        }

        <!-- Empty -->
        @if (!isLoading() && !loadError() && !result()?.items?.length) {
          <app-empty-state
            icon="📋"
            title="No events yet"
            description="Platform-wide actions will be recorded here."
            [dark]="true"
          />
        }

        <!-- Log timeline -->
        @if (!isLoading() && !loadError() && result()?.items?.length) {

          <div class="rounded-xl border border-sup-border overflow-hidden
                      divide-y divide-sup-border">
            @for (log of result()!.items; track log.id) {
              <div class="bg-sup-surface px-5 py-4 flex gap-4 items-start
                          hover:bg-sup-surface-2 transition-colors">

                <!-- Action badge -->
                <div class="shrink-0 mt-0.5">
                  <app-badge [variant]="actionBadge(log.action)">
                    <span class="hidden md:inline">{{ log.action }}</span>
                    <span class="md:hidden" [title]="log.action">
                      {{ actionIcon(log.action) }}
                    </span>
                  </app-badge>
                </div>

                <!-- Main content -->
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">

                    <!-- Tenant name — platform-level addition vs tenant audit log -->
                    @if (log.tenantName) {
                      <span class="text-xs font-bold text-supa-light bg-sup-surface-2
                                   px-1.5 py-0.5 rounded">
                        {{ log.tenantName }}
                      </span>
                    }

                    @if (log.entityType) {
                      <span class="text-xs font-medium text-sup-text-3 uppercase tracking-wide">
                        {{ log.entityType }}
                      </span>
                    }

                    @if (log.details) {
                      <span class="text-sm text-sup-text-1 truncate max-w-[380px]">
                        {{ log.details }}
                      </span>
                    }
                  </div>

                  <!-- Actor + IP + time -->
                  <div class="flex flex-wrap items-center gap-x-3 mt-1 text-xs text-sup-text-3">
                    <span>{{ log.userEmail }}</span>
                    @if (log.ipAddress) {
                      <span class="font-mono hidden sm:inline">{{ log.ipAddress }}</span>
                    }
                    <time [dateTime]="log.createdAt" [title]="log.createdAt | date:'medium'">
                      {{ log.createdAt | date:'dd MMM yyyy, HH:mm' }}
                    </time>
                  </div>
                </div>

                <!-- Entity ID chip -->
                @if (log.entityId) {
                  <span class="shrink-0 hidden xl:block font-mono text-[10px]
                               text-sup-text-3 bg-sup-surface-2 px-1.5 py-0.5 rounded mt-0.5">
                    {{ log.entityId.slice(0, 8) }}
                  </span>
                }

              </div>
            }
          </div>

          <!-- Pagination -->
          @if ((result()?.totalPages ?? 1) > 1) {
            <div class="flex items-center justify-between gap-4">
              <p class="text-sm text-sup-text-3">
                Page {{ currentPage() }} of {{ result()!.totalPages }}
              </p>
              <div class="flex gap-2">
                <app-button
                  variant="ghost" size="sm"
                  [disabled]="currentPage() <= 1"
                  (clicked)="setPage(currentPage() - 1)"
                >← Prev</app-button>
                <app-button
                  variant="ghost" size="sm"
                  [disabled]="currentPage() >= (result()?.totalPages ?? 1)"
                  (clicked)="setPage(currentPage() + 1)"
                >Next →</app-button>
              </div>
            </div>
          }

        }

      </div>
  `,
})
export class SuperAuditLogComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly isLoading   = signal(true);
  readonly loadError   = signal<string | null>(null);
  readonly result      = signal<SuperAuditLogListDto | null>(null);
  readonly currentPage = signal(1);

  private readonly PAGE_SIZE = 30;

  ngOnInit(): void { this.load(); }

  /** GET ${environment.apiUrl}/v1/super/audit-log */
  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    const params = new HttpParams()
      .set('page',     this.currentPage().toString())
      .set('pageSize', this.PAGE_SIZE.toString());

    this.http
      .get<ApiResponse<SuperAuditLogListDto>>(
        `${environment.apiUrl}/v1/super/audit-log`,
        { params }
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.result.set(res.data);
          } else {
            this.loadError.set(res.message ?? 'Failed to load audit log.');
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.loadError.set('Could not reach the server. Please try again.');
        },
      });
  }

  setPage(p: number): void {
    this.currentPage.set(p);
    this.load();
  }

  actionBadge(action: string): 'default' | 'success' | 'warning' | 'danger' {
    return ACTION_BADGE[action] ?? 'default';
  }

  actionIcon(action: string): string {
    return ACTION_ICON[action] ?? '•';
  }
}
