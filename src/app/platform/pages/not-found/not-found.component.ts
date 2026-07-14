import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col items-center justify-center px-6 text-center">
      <p class="font-mono-code text-accent text-sm mb-4">404</p>
      <h1 class="font-display text-4xl font-bold text-sf-text-1 tracking-tight mb-3">
        Page not found
      </h1>
      <p class="text-sf-text-3 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <app-button variant="primary" routerLink="/">Go home</app-button>
    </div>
  `,
})
export class NotFoundComponent {}
