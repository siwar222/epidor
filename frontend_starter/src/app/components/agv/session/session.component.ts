import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ComponentService } from '../../../services/component.service';
import * as bootstrap from 'bootstrap';

interface Session {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasDependencies: boolean;
}

interface SessionActive {
  id: string | null;
  name: string | null;
  isActive: boolean;
  message: string | null;
}

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
  providers: [ApiService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionComponent extends ComponentService<Session> implements OnInit {

  override module = 'sessions';
  currentActiveSession = signal<SessionActive | undefined>(undefined);
  canDeactivateSession = signal(false);
  isSessionDeactivated = signal(false);

  private actionModal: bootstrap.Modal | null = null;
  selectedSession = signal<Session | null>(null);
  actionType = signal('');

  constructor() { super(); }

  ngOnInit(): void {
    this.initializeComponent();
    this.checkActiveSession();

    const actionModal = document.getElementById('actionModal');
    if (actionModal) this.actionModal = new bootstrap.Modal(actionModal);
  }

  checkActiveSession(): void {
    this.isSessionDeactivated.set(false);
    this.apiService.getCustom<SessionActive>(this.module + '/current-active').subscribe({
      next: (response: SessionActive) => {
        this.currentActiveSession.set(response);
      },
      error: (err) => {
        console.error('Erreur lors de la vérification de la session active:', err);
      }
    });
  }

  confirmDeactivateSession(): void {
    this.canDeactivateSession.set(true);
  }

  cancelDeactivateSession(): void {
    this.canDeactivateSession.set(false);
  }

  deactivateSession(sessionId: string | null): void {
    if (!sessionId) return;

    this.apiService.patchCustom<void>(`${this.module}/${sessionId}/deactivate`, {}).subscribe({
      next: () => {
        if (this.currentActiveSession() && this.currentActiveSession()!.id === sessionId) {
          const cur = { ...this.currentActiveSession()!, isActive: false, message: null };
          this.currentActiveSession.set(cur);
          this.getAll();
          this.checkActiveSession();
          this.canDeactivateSession.set(false);
          this.isSessionDeactivated.set(true);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la désactivation de la session :', err);
      }
    });
  }

  activateSession(sessionId: string | null): void {
    if (!sessionId) return;

    this.apiService.patchCustom<void>(`${this.module}/${sessionId}/activate`, {}).subscribe({
      next: () => {
        if (this.currentActiveSession() && this.currentActiveSession()!.id !== sessionId) {
          const cur = { ...this.currentActiveSession()!, isActive: false, message: null };
          this.currentActiveSession.set(cur);
          this.getAll();
          this.checkActiveSession();
          this.canDeactivateSession.set(false);
          this.isSessionDeactivated.set(false);
        }
      },
      error: (err) => {
        console.error('Erreur lors de activation de la session :', err);
      }
    });
  }

  override handleSuccess(isNew: boolean, item: Session) {
    super.handleSuccess(isNew, item);
    this.currentActiveSession.set(undefined);
    this.canDeactivateSession.set(false);
    this.checkActiveSession();
  }

  newItem(): Session {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      id: '',
      name: '',
      description: '',
      startDate: formatDate(startOfYear),
      endDate: formatDate(endOfYear),
      isActive: false,
      hasDependencies: false
    };
  }

  openActionModal(session: Session, action: string) {
    this.selectedSession.set(session);
    this.actionType.set(action);
    this.actionModal?.show();
  }

  closeActionModal() {
    this.actionModal?.hide();
  }

  getActionButtonLabel(): string {
    return {
      approve: 'Approuver',
      disapprove: 'Désapprouver',
      activate: 'Activer',
      deactivate: 'Désactiver'
    }[this.actionType()] || 'Confirmer';
  }

  confirmAction() {
    const sel = this.selectedSession();
    const action = this.actionType();
    if (!sel || !action) return;

    if (action === 'activate') {
      this.activateSession(sel.id ?? null);
      const updated = { ...sel, isActive: true };
      this.selectedSession.set(updated);
    }
    else if (action === 'deactivate') {
      this.deactivateSession(sel.id ?? null);
      const updated = { ...sel, isActive: false };
      this.selectedSession.set(updated);
    }

    this.actionModal?.hide();
  }
}
