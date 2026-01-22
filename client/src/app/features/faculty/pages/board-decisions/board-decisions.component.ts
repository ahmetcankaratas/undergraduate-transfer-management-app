import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ApplicationService } from '../../../../core/services';
import { Application, ApplicationStatus } from '../../../../core/models';

@Component({
    selector: 'app-board-decisions',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, TableModule, ButtonModule, DialogModule, SelectModule, TextareaModule, ToastModule, TagModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="grid">
            <div class="col-12">
                <p-card header="Fakülte Kurulu Kararları">
                    <p-table [value]="applications()" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Başvuru No</th>
                                <th>Öğrenci</th>
                                <th>Hedef Bölüm</th>
                                <th>Sıralama</th>
                                <th>Puan</th>
                                <th>Durum</th>
                                <th>İşlem</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-app>
                            <tr>
                                <td>{{ app.applicationNumber }}</td>
                                <td>{{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}</td>
                                <td>{{ app.targetDepartment }}</td>
                                <td>{{ app.rankings?.[0]?.rank || '-' }}</td>
                                <td>{{ app.rankings?.[0]?.score | number:'1.3-3' }}</td>
                                <td>
                                    <p-tag
                                        [value]="app.rankings?.[0]?.isPrimary ? 'Asil' : 'Yedek'"
                                        [severity]="app.rankings?.[0]?.isPrimary ? 'success' : 'warn'"
                                    ></p-tag>
                                </td>
                                <td>
                                    <p-button
                                        label="Karar Ver"
                                        icon="pi pi-check-square"
                                        size="small"
                                        (onClick)="showDecisionDialog(app)"
                                    ></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <p class="text-500">Kurul kararı bekleyen başvuru bulunmuyor.</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>

        <p-dialog header="Kurul Kararı" [(visible)]="decisionDialogVisible" [modal]="true" [style]="{width: '450px'}">
            <div class="p-fluid">
                <label for="decision" class="block mb-2">Karar</label>
                <p-select
                    id="decision"
                    [(ngModel)]="selectedDecision"
                    [options]="decisionOptions"
                    placeholder="Karar Seçin"
                ></p-select>

                <label for="notes" class="block mb-2 mt-3">Notlar</label>
                <textarea pTextarea id="notes" [(ngModel)]="decisionNotes" rows="3"></textarea>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="İptal" icon="pi pi-times" [text]="true" (onClick)="decisionDialogVisible = false"></p-button>
                <p-button label="Kaydet" icon="pi pi-check" (onClick)="saveDecision()"></p-button>
            </ng-template>
        </p-dialog>
    `
})
export class BoardDecisionsComponent implements OnInit {
    applications = signal<Application[]>([]);
    decisionDialogVisible = false;
    selectedApplication: Application | null = null;
    selectedDecision = '';
    decisionNotes = '';

    decisionOptions = [
        { label: 'Kabul', value: 'APPROVED' },
        { label: 'Red', value: 'REJECTED' },
        { label: 'Şartlı Kabul', value: 'CONDITIONAL' }
    ];

    constructor(
        private applicationService: ApplicationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadApplications();
    }

    private loadApplications() {
        this.applicationService.getAll({ status: ApplicationStatus.RANKED }).subscribe(apps => {
            this.applications.set(apps);
        });
    }

    showDecisionDialog(app: Application) {
        this.selectedApplication = app;
        this.selectedDecision = '';
        this.decisionNotes = '';
        this.decisionDialogVisible = true;
    }

    saveDecision() {
        if (this.selectedApplication && this.selectedDecision) {
            this.applicationService.setFacultyBoardDecision(
                this.selectedApplication.id,
                this.selectedDecision,
                this.decisionNotes
            ).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Kurul kararı kaydedildi.' });
                    this.decisionDialogVisible = false;
                    this.loadApplications();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'İşlem başarısız.' });
                }
            });
        }
    }
}
