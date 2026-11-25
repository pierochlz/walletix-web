import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SHARE_URL, shareLinks, shareText } from '../../core/challenges';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Medal } from '../../core/models';

// US30: card of the medal + "Copy link" + social networks. "Cancel" closes without publishing anything.
@Component({
  selector: 'app-share-medal-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'challenges.shareTitle' | t }}</h2>
    <mat-dialog-content>
      <div class="card" aria-hidden="true">
        <mat-icon class="medal">emoji_events</mat-icon>
        <p class="name">{{ medal.nombre }}</p>
        <p class="desc">{{ medal.descripcion }}</p>
        <p class="brand">Walletix · +{{ medal.puntos }} pts</p>
      </div>
      <p class="text">{{ text }}</p>

      <div class="actions">
        @if (canNativeShare) {
          <button mat-flat-button (click)="nativeShare()"><mat-icon aria-hidden="true">share</mat-icon>{{ 'challenges.shareDevice' | t }}</button>
        }
        <button mat-stroked-button (click)="copy()">
          <mat-icon aria-hidden="true">{{ copied() === 'ok' ? 'check' : 'content_copy' }}</mat-icon>
          {{ (copied() === 'ok' ? 'challenges.copied' : 'challenges.copyLink') | t }}
        </button>
        @for (link of links; track link.network) {
          <a mat-stroked-button [href]="link.href" target="_blank" rel="noopener"
             [attr.aria-label]="('challenges.shareOn' | t) + ' ' + link.network">
            <mat-icon aria-hidden="true">{{ link.icon }}</mat-icon>{{ link.network }}
          </a>
        }
      </div>
      <!-- The result of "Copy" is announced to screen readers -->
      <p class="status" role="status">
        @if (copied() === 'ok') { {{ 'challenges.copied' | t }} }
        @if (copied() === 'error') { {{ 'challenges.copyError' | t }} }
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close cdkFocusInitial>{{ 'form.cancel' | t }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .card { display: grid; justify-items: center; gap: 4px; padding: 20px; border-radius: 16px; text-align: center;
      background: linear-gradient(135deg, #14532d, #15803d); color: #fff; }
    .medal { font-size: 48px; width: 48px; height: 48px; color: #fde68a; }
    .name { margin: 0; font: var(--mat-sys-title-large); }
    .desc { margin: 0; opacity: .9; }
    .brand { margin: 8px 0 0; font: var(--mat-sys-label-medium); opacity: .85; }
    .text { margin: 16px 0 12px; color: var(--mat-sys-on-surface-variant); }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .actions mat-icon { margin-right: 4px; }
    .status { margin: 8px 0 0; min-height: 1em; font: var(--mat-sys-body-small); }
  `,
})
export class ShareMedalDialog {
  readonly medal = inject<Medal>(MAT_DIALOG_DATA);
  private i18n = inject(I18nService);

  readonly text = shareText(this.medal.nombre, this.i18n.lang());
  readonly links = shareLinks(this.text);
  readonly canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;
  readonly copied = signal<'no' | 'ok' | 'error'>('no');

  // Copies the text and the link. If the browser does not allow the modern clipboard,
  // it tries the classic way; if that fails too, it says so (it never fails in silence).
  copy(): void {
    const content = `${this.text} ${SHARE_URL}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content).then(
        () => this.copied.set('ok'),
        () => this.copied.set(copyWithTextarea(content) ? 'ok' : 'error'),
      );
    } else {
      this.copied.set(copyWithTextarea(content) ? 'ok' : 'error');
    }
  }

  nativeShare(): void {
    navigator.share?.({ title: 'Walletix', text: this.text, url: SHARE_URL }).catch(() => {}); // cancelled: nothing happens
  }
}

// Classic copy: a hidden text area + document.execCommand('copy')
function copyWithTextarea(content: string): boolean {
  const area = document.createElement('textarea');
  area.value = content;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}
