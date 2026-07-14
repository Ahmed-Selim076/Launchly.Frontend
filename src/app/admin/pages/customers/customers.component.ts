import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerService } from '../../../core/admin/customer.service';
import { ICustomer, ICustomerList } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-customers',
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
        <h1 class="font-display text-2xl font-bold text-ad-text-1">Customers</h1>
        <p class="text-ad-text-3 text-sm mt-0.5">
          {{ result()?.totalCount ?? 0 }} registered customer{{ (result()?.totalCount ?? 0) !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5,6,7]; track $index) {
            <app-skeleton [dark]="true" height="52px" />
          }
        </div>
      } @else if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load customers"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="load()"
        />
      } @else if (!result()?.items?.length) {
        <app-empty-state
          icon="👥"
          title="No customers yet"
          description="Customers who sign up on your storefront will appear here."
          [dark]="true"
        />
      } @else {
        <div class="rounded-xl border border-ad-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ad-border bg-ad-surface-2">
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Customer</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden sm:table-cell">Email</th>
                <th class="px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Status</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ad-border">
              @for (c of result()!.items; track c.id) {
                <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                  <!-- Avatar + name -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-ad-surface-2 shrink-0
                                  flex items-center justify-center
                                  text-xs font-semibold text-ad-text-2 select-none">
                        {{ initial(c) }}
                      </div>
                      <span class="font-medium text-ad-text-1">{{ c.firstName }} {{ c.lastName }}</span>
                    </div>
                  </td>
                  <!-- Email -->
                  <td class="px-4 py-3 hidden sm:table-cell text-ad-text-2">{{ c.email }}</td>
                  <!-- Status -->
                  <td class="px-4 py-3 hidden md:table-cell">
                    <app-badge [variant]="c.isActive ? 'success' : 'default'">
                      {{ c.isActive ? 'Active' : 'Inactive' }}
                    </app-badge>
                  </td>
                  <!-- Joined date -->
                  <td class="px-4 py-3 hidden lg:table-cell text-xs text-ad-text-3">
                    {{ c.createdAt | date:'dd MMM yyyy' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
export class CustomersComponent implements OnInit {
  private readonly svc = inject(CustomerService);

  readonly loading     = signal(false);
  readonly errored     = signal(false);
  readonly result      = signal<ICustomerList | null>(null);
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

  initial(c: ICustomer): string {
    return ((c.firstName?.[0] ?? '') + (c.lastName?.[0] ?? '')).toUpperCase() || '?';
  }
}
