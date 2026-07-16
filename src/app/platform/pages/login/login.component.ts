import {
  Component, inject, signal,
  ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { TenantService } from '../../../core/tenant/tenant.service';
import { UserRole, IApiResponse, IAuthResponse } from '../../../core/models';
import { environment } from '@env/environment';

// Google Identity Services attaches `google` to the global scope once its
// script has loaded — there's no @types package for it here (no network
// access in this environment to install one), so it's declared loosely.
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <!-- Top bar -->
      <div class="h-16 border-b border-sf-border flex items-center px-6 justify-between">
        <a routerLink="/" class="font-display font-bold text-xl text-sf-text-1">Launchly</a>
        @if (isCustomerContext) {
          <span class="text-sm text-sf-text-3">
            No account?
            <a routerLink="/signup" class="text-accent hover:underline ml-1">Create one</a>
          </span>
        } @else {
          <span class="text-sm text-sf-text-3">
            No account?
            <a routerLink="/signup" class="text-accent hover:underline ml-1">Sign up free</a>
          </span>
        }
      </div>

      <!-- Form area -->
      <div class="flex-1 flex items-center justify-center py-12 px-6">
        <div class="w-full max-w-sm">
          <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Welcome back</h1>
          <p class="text-sf-text-3 mb-8">
            @if (isCustomerContext) {
              Sign in to view your account and order history.
            } @else {
              Sign in to your Launchly account.
            }
          </p>

          @if (googleEnabled) {
            <div class="mb-5">
              <div #googleBtn class="flex justify-center"></div>
              <div class="flex items-center gap-3 my-5">
                <div class="h-px bg-sf-border flex-1"></div>
                <span class="text-xs text-sf-text-3 uppercase tracking-wide">or</span>
                <div class="h-px bg-sf-border flex-1"></div>
              </div>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input
              formControlName="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              [required]="true"
              autocomplete="email"
              [error]="emailError()"
            ></app-input>

            <div>
              <app-input
                formControlName="password"
                label="Password"
                type="password"
                placeholder="Your password"
                [required]="true"
                autocomplete="current-password"
                [error]="passwordError()"
              ></app-input>
              <div class="flex justify-end mt-1.5">
                <a routerLink="/forgot-password"
                  class="text-xs text-sf-text-3 hover:text-accent transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <!-- Server error -->
            @if (serverError()) {
              <p class="text-sm text-[var(--color-danger)] bg-[var(--color-danger-dim)]
                         rounded-md px-3 py-2" role="alert">
                {{ serverError() }}
              </p>
            }

            <app-button
              variant="primary" type="submit" [fullWidth]="true" size="lg"
              [loading]="loading()"
            >
              Sign in
            </app-button>
          </form>

          @if (isCustomerContext) {
            <p class="text-xs text-sf-text-3 text-center mt-6">
              New here? <a routerLink="/signup" class="text-accent hover:underline">Create an account</a>,
              or just check out as a guest — either way works.
            </p>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtnRef?: ElementRef<HTMLDivElement>;

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tenantService = inject(TenantService);

  readonly loading       = signal(false);
  readonly serverError   = signal('');
  readonly googleEnabled = this.auth.googleEnabled;

  // This same LoginComponent is registered as the /login route both at the
  // platform root (tenant-admin sign-in) AND on every tenant subdomain
  // (customer sign-in — linked from the storefront's account page and
  // checkout). Those are two different backends: the tenant-admin endpoint
  // (auth.login()) explicitly rejects Customer accounts server-side, so
  // without this branch a customer's correct password would always come
  // back "Invalid email or password." Its "Sign up free" link also pointed
  // at /signup, the multi-step store-creation wizard — a route that's only
  // ever registered at the platform root, hence the 404 when a customer
  // hit it from inside a store.
  readonly isCustomerContext =
    !this.tenantService.isPlatformRoot() && !this.tenantService.isSuperAdminSubdomain();

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  emailError(): string {
    const c = this.form.get('email')!;
    if (!c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Email is required.';
    if (c.errors['email'])    return 'Please enter a valid email.';
    return '';
  }

  passwordError(): string {
    const c = this.form.get('password')!;
    if (!c.touched || !c.errors) return '';
    return 'Password is required.';
  }

  // ─── Password login ────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.loading()) return;

    this.serverError.set('');
    this.loading.set(true);

    const { email, password } = this.form.value;
    const credentials = { email: email!, password: password! };

    const request$ = this.isCustomerContext
      ? this.auth.loginCustomer(credentials)
      : this.auth.login(credentials);

    request$.subscribe({
      next: res => {
        this.loading.set(false);
        if (this.isCustomerContext) {
          this.handleCustomerAuthResult(res);
        } else {
          this.handleAuthResult(res);
        }
      },
      error: () => {
        this.loading.set(false);
        this.serverError.set('Invalid email or password.');
      },
    });
  }

  // ─── Google login ───────────────────────────────────────────────────────────
  // Google Identity Services renders its own button once its script loads and
  // `initialize()` has run — there's no [hidden] toggle needed, the whole
  // block is just left out of the template when googleEnabled is false (i.e.
  // the client ID placeholder in environment.ts hasn't been replaced yet).

  ngAfterViewInit(): void {
    if (!this.googleEnabled) return;
    this.loadGoogleScript()
      .then(() => this.renderGoogleButton())
      .catch(() => {
        // Script failed to load (offline, ad-blocker, etc.) — password
        // login still works fine, so just drop the Google button silently
        // rather than showing an error for a feature the person didn't
        // explicitly try to use.
      });
  }

  private loadGoogleScript(): Promise<void> {
    if ((window as any).google?.accounts?.id) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
      document.head.appendChild(script);
    });
  }

  private renderGoogleButton(): void {
    if (!this.googleBtnRef) return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.onGoogleCredential(response.credential),
    });

    google.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'signin_with',
    });
  }

  private onGoogleCredential(idToken: string): void {
    this.serverError.set('');
    this.loading.set(true);

    this.auth.loginWithGoogle(idToken).subscribe({
      next: res => {
        this.loading.set(false);
        if (this.isCustomerContext) {
          this.handleCustomerAuthResult(res);
        } else {
          this.handleAuthResult(res);
        }
      },
      error: () => {
        this.loading.set(false);
        this.serverError.set('Google sign-in failed. Please try again.');
      },
    });
  }

  // ─── Shared post-login redirect ────────────────────────────────────────────
  // Same decision for both password and Google login: SuperAdmin stays on
  // this host and goes to /super (it lives in this host's own static route
  // table). A TenantAdmin already on their own subdomain gets an in-app
  // navigate to /admin. A TenantAdmin logging in from the platform root needs
  // a real cross-origin redirect — '/admin' isn't registered on this host at
  // all (see signup.component.ts) — with tokens handed off via the URL
  // fragment since localStorage doesn't carry across origins.

  private handleAuthResult(res: IApiResponse<IAuthResponse>): void {
    if (!res.success || !res.data) {
      this.serverError.set(res.message ?? 'Login failed. Please try again.');
      return;
    }

    const user = res.data.user;

    if (user.role === UserRole.SuperAdmin) {
      this.router.navigate(['/super']);
      return;
    }

    if (!user.tenantSubdomain) {
      this.serverError.set('This account has no associated store.');
      return;
    }

    if (this.tenantService.getSubdomain() === user.tenantSubdomain) {
      this.router.navigate(['/admin']);
      return;
    }

    const authHandoff = encodeURIComponent(JSON.stringify({
      at: res.data.accessToken,
      rt: res.data.refreshToken,
    }));
    window.location.href =
      `${this.tenantService.buildTenantUrl(user.tenantSubdomain, '/admin')}#auth=${authHandoff}`;
  }

  // ─── Customer post-login redirect ──────────────────────────────────────────
  // Simpler than the admin case: a customer is already on the correct tenant
  // host when they hit this form (there's no cross-origin redirect to do),
  // so this just confirms success and sends them to their account page.

  private handleCustomerAuthResult(res: IApiResponse<IAuthResponse>): void {
    if (!res.success || !res.data) {
      this.serverError.set(res.message ?? 'Invalid email or password.');
      return;
    }

    this.toast.success('Welcome back!');
    this.router.navigate(['/account']);
  }
}
