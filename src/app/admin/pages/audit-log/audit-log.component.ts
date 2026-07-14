import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuditLogService } from '../../../core/admin/audit-log.service';
import { IAuditLog, IAuditLogList } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

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

@Component({
  selector: 'app-admin-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent, BadgeComponent, SkeletonComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div>
        <h1 class="font-display text-2xl font-bold text-ad-text-1">Audit Log</h1>
        <p class="text-ad-text-3 text-sm mt-0.5">
          {{ result()?.totalCount ?? 0 }} event{{ (result()?.totalCount ?? 0) !== 1 ? 's' : '' }} recorded
        </p>
      </div>

      <!-- Log -->
      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
            <app-skeleton [dark]="true" height="60px" />
          }
        </div>
      } @else if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load audit log"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="load()"
        />
      } @else if (!result()?.items?.length) {
        <app-empty-state
          icon="📋"
          title="No events yet"
          description="Actions performed in this store will be recorded here."
          [dark]="true"
        />
      } @else {
        <!-- Timeline list -->
        <div class="rounded-xl border border-ad-border overflow-hidden divide-y divide-ad-border">
          @for (log of result()!.items; track log.id) {
            <div class="bg-ad-surface px-4 py-3 flex gap-4 items-start
                        hover:bg-ad-surface-2 transition-colors">

              <!-- Action badge (icon only on small, full on md+) -->
              <div class="shrink-0 mt-0.5">
                <app-badge [variant]="actionBadge(log.action)">
                  <span class="hidden md:inline">{{ log.action }}</span>
                  <span class="md:hidden" [title]="log.action">{{ actionIcon(log.action) }}</span>
                </app-badge>
              </div>

              <!-- Main content -->
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <!-- Entity type + details -->
                  @if (log.entityType) {
                    <span class="text-xs font-medium text-ad-text-3 uppercase tracking-wide">
                      {{ log.entityType }}
                    </span>
                  }
                  @if (log.details) {
                    <span class="text-sm text-ad-text-1 truncate max-w-[420px]">{{ log.details }}</span>
                  }
                </div>
                <!-- Actor + time -->
                <div class="flex flex-wrap items-center gap-x-3 mt-1 text-xs text-ad-text-3">
                  <span>{{ log.userEmail }}</span>
                  @if (log.ipAddress) {
                    <span class="font-mono hidden sm:inline">{{ log.ipAddress }}</span>
                  }
                  <time [dateTime]="log.createdAt" [title]="log.createdAt | date:'medium'">
                    {{ log.createdAt | date:'dd MMM yyyy, HH:mm' }}
                  </time>
                </div>
              </div>

              <!-- Entity ID chip (hidden on small) -->
              @if (log.entityId) {
                <span class="shrink-0 hidden xl:block font-mono text-[10px]
                             text-ad-text-3 bg-ad-surface-2 px-1.5 py-0.5 rounded mt-0.5">
                  {{ log.entityId.slice(0, 8) }}
                </span>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if ((result()?.totalPages ?? 1) > 1) {
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-ad-text-3">
              Page {{ currentPage() }} of {{ result()?.totalPages }}
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
export class AuditLogComponent implements OnInit {
  private readonly svc = inject(AuditLogService);

  readonly loading     = signal(false);
  readonly errored     = signal(false);
  readonly result      = signal<IAuditLogList | null>(null);
  readonly currentPage = signal(1);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.svc.getAll(this.currentPage()).subscribe({
      next: res => { this.result.set(res.data ?? null); this.loading.set(false); },
      error: ()  => { this.errored.set(true);           this.loading.set(false); },
    });
  }

  setPage(p: number): void { this.currentPage.set(p); this.load(); }

  actionBadge(action: string): 'default' | 'success' | 'warning' | 'danger' {
    return ACTION_BADGE[action] ?? 'default';
  }

  actionIcon(action: string): string {
    return ACTION_ICON[action] ?? '•';
  }
}
