import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { BookingService, IAppointmentsQuery } from '../../../core/admin/booking.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IAppointment, IService, IPagedResult } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

const STATUS_OPTIONS: ISelectOption[] = [
  { value: 'Pending',   label: 'Pending'   },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const FILTER_OPTIONS: ISelectOption[] = [
  { value: '', label: 'All statuses' },
  ...STATUS_OPTIONS,
];

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  Pending:   'warning',
  Confirmed: 'default',
  Completed: 'success',
  Cancelled: 'danger',
};

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonComponent, SelectComponent, ModalComponent,
    BadgeComponent, SkeletonComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-ad-text-1">Appointments</h1>
          <p class="text-ad-text-3 text-sm mt-0.5">
            {{ pagedResult()?.totalCount ?? 0 }} total appointments
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <app-select
          placeholder="All statuses"
          [options]="filterOptions"
          [formControl]="statusFilterCtrl"
          [dark]="true"
          class="w-44"
        />
        <app-select
          placeholder="All services"
          [options]="serviceFilterOptions()"
          [formControl]="serviceFilterCtrl"
          [dark]="true"
          class="w-52"
        />
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5]; track $index) {
            <app-skeleton [dark]="true" height="56px" />
          }
        </div>
      } @else if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load appointments"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="load()"
        />
      } @else if (!pagedResult()?.items?.length) {
        <app-empty-state
          icon="📅"
          title="No appointments yet"
          description="Appointments booked by customers will appear here."
          [dark]="true"
        />
      } @else {
        <div class="rounded-xl border border-ad-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ad-border bg-ad-surface-2">
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Customer</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden sm:table-cell">Service</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Date & Time</th>
                <th class="px-4 py-3 text-ad-text-3 font-medium">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ad-border">
              @for (appt of pagedResult()!.items; track appt.id) {
                <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                  <td class="px-4 py-3">
                    <p class="font-medium text-ad-text-1">{{ appt.customerName }}</p>
                    <p class="text-xs text-ad-text-3">{{ appt.customerEmail }}</p>
                  </td>
                  <td class="px-4 py-3 hidden sm:table-cell text-ad-text-2">{{ appt.serviceName }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <p class="text-ad-text-1 text-xs">{{ appt.startTime | date:'dd MMM yyyy' }}</p>
                    <p class="text-ad-text-3 text-xs">
                      {{ appt.startTime | date:'HH:mm' }} – {{ appt.endTime | date:'HH:mm' }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <app-badge [variant]="badgeVariant(appt.status)">{{ appt.status }}</app-badge>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <app-button
                      variant="ghost" size="sm"
                      [disabled]="appt.status === 'Completed' || appt.status === 'Cancelled'"
                      (clicked)="openStatusModal(appt)"
                    >Update</app-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if ((pagedResult()?.totalPages ?? 1) > 1) {
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-ad-text-3">
              Page {{ currentPage() }} of {{ pagedResult()?.totalPages }}
            </p>
            <div class="flex gap-2">
              <app-button
                variant="ghost" size="sm"
                [disabled]="currentPage() <= 1"
                (clicked)="setPage(currentPage() - 1)"
              >← Prev</app-button>
              <app-button
                variant="ghost" size="sm"
                [disabled]="currentPage() >= (pagedResult()?.totalPages ?? 1)"
                (clicked)="setPage(currentPage() + 1)"
              >Next →</app-button>
            </div>
          </div>
        }
      }
    </div>

    <!-- ── Status Update Modal ─────────────────────────────────────────────── -->
    @if (statusModalAppt()) {
      <app-modal
        title="Update Appointment Status"
        [dark]="true"
        (closed)="closeStatusModal()"
      >
        <div class="space-y-4">
          <p class="text-sm text-ad-text-2">
            {{ statusModalAppt()!.customerName }} —
            <span class="font-medium text-ad-text-1">{{ statusModalAppt()!.serviceName }}</span>
          </p>
          <p class="text-xs text-ad-text-3">
            Current status:
            <app-badge [variant]="badgeVariant(statusModalAppt()!.status)">
              {{ statusModalAppt()!.status }}
            </app-badge>
          </p>
          <app-select
            label="New status"
            [options]="nextStatusOptions()"
            [formControl]="newStatusCtrl"
            [dark]="true"
          />
        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <app-button variant="ghost" [dark]="true" (clicked)="closeStatusModal()">Cancel</app-button>
          <app-button
            variant="primary"
            [loading]="saving()"
            [disabled]="!newStatusCtrl.value"
            (clicked)="confirmStatusUpdate()"
          >Save</app-button>
        </div>
      </app-modal>
    }
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly svc   = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  readonly filterOptions    = FILTER_OPTIONS;
  readonly statusFilterCtrl  = this.fb.control<string>('');
  readonly serviceFilterCtrl = this.fb.control<string>('');
  readonly newStatusCtrl     = this.fb.control<string>('');

  readonly loading         = signal(false);
  readonly errored         = signal(false);
  readonly saving          = signal(false);
  readonly pagedResult     = signal<IPagedResult<IAppointment> | null>(null);
  readonly currentPage     = signal(1);
  readonly services        = signal<IService[]>([]);
  readonly statusModalAppt = signal<IAppointment | null>(null);

  readonly serviceFilterOptions = computed<ISelectOption[]>(() => [
    { value: '', label: 'All services' },
    ...this.services().map(s => ({ value: s.id, label: s.name })),
  ]);

  readonly nextStatusOptions = computed<ISelectOption[]>(() => {
    const appt = this.statusModalAppt();
    if (!appt) return [];
    return STATUS_OPTIONS.filter(o => o.value !== appt.status);
  });

  ngOnInit(): void {
    // Load service list for the filter dropdown (fire-and-forget — non-critical)
    this.svc.getServices().subscribe({ next: res => this.services.set(res.data ?? []) });

    this.statusFilterCtrl.valueChanges.subscribe(() => { this.currentPage.set(1); this.load(); });
    this.serviceFilterCtrl.valueChanges.subscribe(() => { this.currentPage.set(1); this.load(); });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    const query: IAppointmentsQuery = {
      page:      this.currentPage(),
      pageSize:  20,
      status:    this.statusFilterCtrl.value  || null,
      serviceId: this.serviceFilterCtrl.value || null,
    };
    this.svc.getAppointments(query).subscribe({
      next: res => { this.pagedResult.set(res.data ?? null); this.loading.set(false); },
      error: ()  => { this.errored.set(true); this.loading.set(false); },
    });
  }

  setPage(p: number): void { this.currentPage.set(p); this.load(); }

  openStatusModal(appt: IAppointment): void {
    this.newStatusCtrl.reset('');
    this.statusModalAppt.set(appt);
  }

  closeStatusModal(): void { this.statusModalAppt.set(null); }

  confirmStatusUpdate(): void {
    const appt = this.statusModalAppt();
    const val  = this.newStatusCtrl.value;
    if (!appt || !val) return;
    this.saving.set(true);
    this.svc.updateAppointmentStatus(appt.id, { status: val }).subscribe({
      next: res => {
        this.saving.set(false);
        this.toast.success(`Appointment status updated to ${res.data?.status ?? val}.`);
        this.closeStatusModal();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to update appointment status.');
      },
    });
  }

  badgeVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
    return STATUS_BADGE[status] ?? 'default';
  }
}
