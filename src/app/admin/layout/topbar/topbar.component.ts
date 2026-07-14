import {
  Component, inject, input, output, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * AdminTopbarComponent
 *
 * Slim top bar for the admin dashboard.
 * On mobile: shows hamburger that emits (menuToggle) to the shell.
 * On desktop: hidden — sidebar is always visible.
 * Shows current page title (passed as input) + user avatar.
 */
@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="lg:hidden flex items-center justify-between h-14 px-4
             bg-ad-surface border-b border-ad-border"
      aria-label="Admin top bar"
    >
      <!-- Hamburger -->
      <button
        type="button"
        (click)="menuToggle.emit()"
        class="w-9 h-9 flex items-center justify-center rounded-md text-ad-text-2
               hover:bg-ad-surface-2 hover:text-ad-text-1 transition-colors duration-120
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Open navigation menu"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.75"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <!-- Page title -->
      <span class="text-ad-text-1 font-semibold text-sm">
        {{ pageTitle() }}
      </span>

      <!-- User avatar -->
      <div
        class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold"
        style="background: var(--color-accent);"
        [attr.aria-label]="'Logged in as ' + userName()"
      >
        @if (auth.avatarUrl(); as url) {
          <img [src]="url" alt="" class="h-full w-full object-cover" />
        } @else {
          {{ userInitial() }}
        }
      </div>
    </header>
  `,
})
export class AdminTopbarComponent {
  readonly auth = inject(AuthService);

  readonly pageTitle  = input<string>('Dashboard');
  readonly menuToggle = output<void>();

  readonly userInitial = () =>
    (this.auth.currentUser()?.firstName?.[0] ?? 'A').toUpperCase();

  readonly userName = () => {
    const u = this.auth.currentUser();
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  };
}
