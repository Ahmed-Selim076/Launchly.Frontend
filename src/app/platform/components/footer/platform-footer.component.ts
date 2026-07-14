import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-platform-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-sf-border bg-sf-bg py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span class="font-display font-bold text-sf-text-1">Launchly</span>
          <p class="text-xs text-sf-text-3 mt-1">
            © {{ year }} Launchly. All rights reserved.
          </p>
        </div>
        <nav class="flex items-center gap-6 text-sm text-sf-text-3">
          <a routerLink="/pricing" class="hover:text-sf-text-1 transition-colors">Pricing</a>
          <a routerLink="/login"   class="hover:text-sf-text-1 transition-colors">Sign in</a>
          <a routerLink="/signup"  class="hover:text-sf-text-1 transition-colors">Sign up</a>
        </nav>
      </div>
    </footer>
  `,
})
export class PlatformFooterComponent {
  readonly year = new Date().getFullYear();
}
