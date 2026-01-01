import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

export interface Visit {
  id?: string;
  jour: string;
  heure: string;
  directionId: string | null;
  directionName?: string;
  visitorId: number | null;
  visitorName?: string;
  VisitTypeId: number | null; // <-- type number
  visitName?: string;
  description?: string;
}

@Component({
  selector: 'app-visit',
  standalone: true,
  templateUrl: './visit.html',
  styleUrls: ['./visit.css'],
  imports: [CommonModule, FormsModule]
})
export class VisitComponent implements OnInit {

  visits: Visit[] = [];
  newVisit: Visit = { jour: '', heure: '', directionId: null, visitorId: null, VisitTypeId: null, description: '' };
  visitToDelete: Visit | null = null;

  directions: { id: string; name: string }[] = [];
  visitors: { id: number; nom: string; prenom: string }[] = [];
  visitTypes: { id: number; name: string }[] = [];
  editingIndex: number | null = null;

  page: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;
  pageSizes: number[] = [5, 10, 20, 50];

  searchQuery: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isEditing: boolean = false;
  isNew: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private apiService: ApiService, private location: Location) { }

  ngOnInit(): void {
    this.loadDirections();
    this.loadVisitors();
    this.loadVisitTypes();
    this.loadVisits();
  }

  loadDirections(): void {
    this.apiService.getAll('directions').subscribe({
      next: (res: any) => {
        const items = Array.isArray(res.items) ? res.items : [];
        this.directions = items.map((d: any) => ({
          id: d.id || d.Id || '',
          name: d.name || d.libelle || ''
        }));
      },
      error: () => this.directions = []
    });
  }

  loadVisitors(): void {
    this.apiService.getAll('visitors').subscribe({
      next: (res: any) => {
        const items = Array.isArray(res.items) ? res.items : [];
        this.visitors = items.map((v: any) => ({
          id: v.id || v.Id || 0,
          nom: v.nom || v.lastName || '',
          prenom: v.prenom || v.firstName || ''
        }));
      },
      error: () => this.visitors = []
    });
  }

  loadVisitTypes(): void {
    this.apiService.getAll('VisitTypes').subscribe({
      next: (res: any) => {
        const items = Array.isArray(res.items) ? res.items : [];
        this.visitTypes = items.map((v: any) => ({
          id: Number(v.IdGuid || v.id || 0), // id number
          name: v.name || ''
        }));
      },
      error: () => this.visitTypes = []
    });
  }

  loadVisits(): void {
    this.apiService.getPaginated<any>('Visit', this.page, this.pageSize).subscribe({
      next: (res: any) => {
        this.visits = res.items.map((v: any) => {
          const visitorFromList = this.visitors.find(vis => vis.id === (v.visitorId || 0));
          const directionFromList = this.directions.find(d => d.id === (v.directionId || ''));
          const visitTypeFromList = this.visitTypes.find(vt => vt.id === Number(v.VisitTypeId));

          return {
            id: v.id || '',
            jour: v.jour,
            heure: v.heure,
            directionId: v.directionId,
            directionName: v.directionName || directionFromList?.name || '',
            visitorId: v.visitorId,
            visitorName: v.visitorName || (visitorFromList ? `${visitorFromList.nom} ${visitorFromList.prenom}` : ''),
            VisitTypeId: Number(v.VisitTypeId || 0),
            visitName: v.visitName || visitTypeFromList?.name || '',
            description: v.description || ''
          };
        });
        this.totalPages = Math.ceil(res.totalCount / this.pageSize);
      },
      error: (err) => console.error(err)
    });
  }

  addVisit(): void {
    const isVisitorValid = this.newVisit.visitorId != null;
    const isDirectionValid = this.newVisit.directionId != null && String(this.newVisit.directionId).trim().length > 0;
    const isVisitTypeValid = this.newVisit.VisitTypeId != null;
    const isJourValid = (this.newVisit.jour || '').trim().length > 0;
    const isHeureValid = (this.newVisit.heure || '').trim().length > 0;

    if (!isVisitorValid || !isVisitTypeValid || !isDirectionValid || !isJourValid || !isHeureValid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Visiteur, VisitType, Direction, Jour, Heure).';
      this.successMessage = '';
      return;
    }

    const jourFormatted = new Date(this.newVisit.jour).toISOString().split('T')[0];
    const [hoursStr, minutesStr] = this.newVisit.heure.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    const heureFormatted = `${isNaN(hours) ? '00' : hours.toString().padStart(2, '0')}:${isNaN(minutes) ? '00' : minutes.toString().padStart(2, '0')}:00`;

    const payload = {
      jour: jourFormatted,
      heure: heureFormatted,
      directionId: this.newVisit.directionId,
      visitorId: this.newVisit.visitorId,
      VisitTypeId: this.newVisit.VisitTypeId,
      description: this.newVisit.description
    };

    this.apiService.create('Visit', payload).subscribe({
      next: () => {
        this.loadVisits();
        this.successMessage = 'Visit ajouté avec succès!';
        this.errorMessage = '';
        this.cancelEdit();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la sauvegarde.';
        this.successMessage = '';
      }
    });
  }

  updateVisit(): void {
    if (!this.newVisit.id) return;

    const payload = {
      jour: this.newVisit.jour,
      heure: this.newVisit.heure,
      directionId: this.newVisit.directionId,
      visitorId: this.newVisit.visitorId,
      VisitTypeId: this.newVisit.VisitTypeId,
      description: this.newVisit.description
    };

    this.apiService.update('Visit', this.newVisit.id, payload).subscribe({
      next: () => {
        this.loadVisits();
        this.successMessage = 'Visit modifié avec succès!';
        this.errorMessage = '';
        this.cancelEdit();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la modification.';
        this.successMessage = '';
      }
    });
  }

  editVisit(i: number): void {
    const visit = this.visits[i];
    this.newVisit = { ...visit };
    this.isEditing = true;
    this.isNew = false;
    this.editingIndex = i;
  }

  deleteVisit(i: number): void {
    const visit = this.visits[i];
    if (!visit.id) return;
    this.apiService.delete('Visit', visit.id).subscribe({
      next: () => {
        this.visits.splice(i, 1);
        this.successMessage = 'Visit supprimé avec succès!';
        this.errorMessage = '';
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la suppression.';
        this.successMessage = '';
      }
    });
  }

  openDeleteModal(v: Visit): void {
    this.visitToDelete = v;
  }

  confirmDelete(): void {
    if (this.visitToDelete) {
      const index = this.visits.indexOf(this.visitToDelete);
      if (index !== -1) this.deleteVisit(index);
      this.visitToDelete = null;
    }
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadVisits();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadVisits();
  }
  filterVisit(): void { }

  sortData(column: string): void {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.sortVisit();
  }

  resetForm(): void {
    this.newVisit = { jour: '', heure: '', directionId: null, visitorId: null, VisitTypeId: null, description: '' };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isNew = true;
    this.resetForm();
    this.editingIndex = null;
  }
private sortVisit(): void {
    if (!this.sortColumn) return;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    const col = this.sortColumn;

    const toTime = (t: string | undefined) => {
      if (!t) return 0;
      const [h, m, s] = t.split(':').map(n => Number(n));
      return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    };

    const getValue = (s: any) => {
      switch (col) {
        case 'jour': return s.jour ? new Date(s.jour).getTime() : 0;
        case 'heure': return toTime(s.heure);
        case 'visitorName': return (s.visitorName || '').toLowerCase();
        case 'visitName': return (s.visitName || '').toLowerCase();
        case 'directionName': return (s.directionName || '').toLowerCase();
        default: return '';
      }
    };

    this.visits = [...this.visits].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }

  cancel(): void {
    this.cancelEdit();
    this.successMessage = '';
    this.errorMessage = '';
  }

  addNew(): void {
    this.isEditing = true;
    this.isNew = true;
    this.resetForm();
  }
  onVisitorChange(value: any): void {
    const num = Number(value);
    this.newVisit.visitorId = Number.isFinite(num) ? num : null;
  }

  onVisitTypeChange(value: any): void {
    this.newVisit.VisitTypeId = Number(value) || null;
  }

  onDirectionChange(value: any): void {
    this.newVisit.directionId = value ?? null;
  }

  onSubmit(): void {
    if (this.isNew) this.addVisit();
    else this.updateVisit();
  }

  edit(v: Visit): void {
    const index = this.visits.indexOf(v);
    if (index !== -1) this.editVisit(index);
  }

  goBack(): void {
    this.location.back();
  }
}

