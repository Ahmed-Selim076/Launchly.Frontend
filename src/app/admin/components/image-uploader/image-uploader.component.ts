import {
  Component, ChangeDetectionStrategy, Input, Output,
  EventEmitter, inject, signal, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService, UploadType } from '../../../core/admin/upload.service';

/**
 * Reusable image uploader for admin sections.
 *
 * Usage:
 *   <app-image-uploader
 *     type="product"
 *     [currentUrl]="product.imageUrl"
 *     (uploaded)="onImageUploaded($event)"
 *   />
 *
 * Emits the Cloudinary secure_url after the 3-step signed upload flow completes.
 * The parent is responsible for saving that URL to the backend (via product PUT
 * or settings PATCH) — this component only handles the upload itself.
 *
 * Accepts: JPEG, PNG, WebP up to 5 MB.
 */
@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
             transition-colors duration-200 cursor-pointer select-none overflow-hidden
             min-h-[160px]"
      [class.border-[var(--color-accent)]]="dragOver()"
      [class.bg-[var(--color-accent-dim)]]="dragOver()"
      [class.border-ad-border]="!dragOver()"
      [class.bg-ad-surface-2]="!dragOver()"
      (click)="fileInput.click()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
      role="button"
      aria-label="Upload image"
    >
      <!-- Preview -->
      @if (preview()) {
        <img
          [src]="preview()"
          alt="Product image preview"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <!-- Dark scrim + change label on hover -->
        <div class="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors
                    flex items-center justify-center">
          <span class="opacity-0 hover:opacity-100 transition-opacity
                       text-white text-sm font-medium px-3 py-1 rounded-lg bg-black/60">
            Change image
          </span>
        </div>
      } @else {
        <!-- Empty state -->
        <div class="flex flex-col items-center gap-2 px-4 py-6 text-center pointer-events-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
               class="w-8 h-8 text-ad-text-3">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="text-sm text-ad-text-2 font-medium">
            {{ dragOver() ? 'Drop to upload' : 'Drag & drop or click to upload' }}
          </p>
          <p class="text-xs text-ad-text-3">JPEG, PNG, WebP · max 5 MB</p>
        </div>
      }

      <!-- Upload progress overlay -->
      @if (uploading()) {
        <div class="absolute inset-0 bg-ad-surface/80 flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-ad-border border-t-[var(--color-accent)]
                      animate-spin"></div>
          <p class="text-sm text-ad-text-2">Uploading…</p>
        </div>
      }
    </div>

    <!-- Error -->
    @if (error()) {
      <p class="mt-1.5 text-xs text-[var(--color-danger)]" role="alert">{{ error() }}</p>
    }

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="sr-only"
      (change)="onFileSelected($event)"
    />
  `,
})
export class ImageUploaderComponent {
  private readonly uploadSvc = inject(UploadService);

  @Input() type: UploadType = 'product';
  /** Pass existing imageUrl to show as preview on load */
  @Input() set currentUrl(url: string | null | undefined) {
    if (url) this.preview.set(url);
  }

  @Output() uploaded = new EventEmitter<string>();

  readonly preview   = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly error     = signal('');
  readonly dragOver  = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    input.value = ''; // allow re-selecting the same file
    if (file) this.#processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.#processFile(file);
  }

  #processFile(file: File): void {
    this.error.set('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.error.set('Only JPEG, PNG, or WebP images are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Image must be 5 MB or smaller.');
      return;
    }

    // Show local preview immediately for responsiveness
    const reader = new FileReader();
    reader.onload = () => this.preview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.uploading.set(true);
    this.uploadSvc.upload(file, this.type).subscribe({
      next: secureUrl => {
        this.uploading.set(false);
        this.preview.set(secureUrl);
        this.uploaded.emit(secureUrl);
      },
      error: (err: Error) => {
        this.uploading.set(false);
        this.error.set(err.message ?? 'Upload failed. Please try again.');
        // Keep the local preview visible — don't revert to empty on error
      },
    });
  }
}
