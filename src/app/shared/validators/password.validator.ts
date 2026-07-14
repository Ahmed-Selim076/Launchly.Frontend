import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function hasUpperCase(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    /[A-Z]/.test(control.value ?? '') ? null : { hasUpperCase: true };
}

export function hasLowerCase(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    /[a-z]/.test(control.value ?? '') ? null : { hasLowerCase: true };
}

export function hasDigit(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    /[0-9]/.test(control.value ?? '') ? null : { hasDigit: true };
}

/** Drop-in array of validators to use wherever a password field is defined. */
export const PASSWORD_VALIDATORS: ValidatorFn[] = [
  hasUpperCase(),
  hasLowerCase(),
  hasDigit(),
];
