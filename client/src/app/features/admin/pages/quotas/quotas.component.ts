import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface DepartmentQuota {
    id: number;
    department: string;
    faculty: string;
    quota: number;
    filledQuota: number;
}

@Component({
    selector: 'app-quotas',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, TableModule, ButtonModule, DialogModule, InputNumberModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="grid">
            <div class="col-12">
                <p-card header="Kontenjan Yönetimi">
                    <p-table [value]="quotas()" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Bölüm</th>
                                <th>Fakülte</th>
                                <th>Kontenjan</th>
                                <th>Doluluk</th>
                                <th>Kalan</th>
                                <th>İşlem</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-quota>
                            <tr>
                                <td>{{ quota.department }}</td>
                                <td>{{ quota.faculty }}</td>
                                <td>{{ quota.quota }}</td>
                                <td>{{ quota.filledQuota }}</td>
                                <td>{{ quota.quota - quota.filledQuota }}</td>
                                <td>
                                    <p-button icon="pi pi-pencil" size="small" [text]="true" (onClick)="showEditDialog(quota)"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center p-4">
                                    <p class="text-500">Kontenjan bilgisi bulunamadı.</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>

        <p-dialog header="Kontenjan Düzenle" [(visible)]="dialogVisible" [modal]="true" [style]="{width: '400px'}">
            <div class="p-fluid" *ngIf="selectedQuota">
                <div class="mb-3">
                    <label class="block mb-2 font-semibold">Bölüm</label>
                    <p>{{ selectedQuota.department }}</p>
                </div>
                <div class="field">
                    <label for="quota">Kontenjan</label>
                    <p-inputNumber id="quota" [(ngModel)]="editQuota" [min]="0"></p-inputNumber>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="İptal" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false"></p-button>
                <p-button label="Kaydet" icon="pi pi-check" (onClick)="saveQuota()"></p-button>
            </ng-template>
        </p-dialog>
    `
})
export class QuotasComponent implements OnInit {
    quotas = signal<DepartmentQuota[]>([]);
    dialogVisible = false;
    selectedQuota: DepartmentQuota | null = null;
    editQuota = 0;

    constructor(private messageService: MessageService) {}

    ngOnInit() {
        this.loadQuotas();
    }

    private loadQuotas() {
        // Mock data for now
        this.quotas.set([
            { id: 1, department: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi', quota: 10, filledQuota: 3 },
            { id: 2, department: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi', quota: 8, filledQuota: 2 },
            { id: 3, department: 'Makine Mühendisliği', faculty: 'Mühendislik Fakültesi', quota: 6, filledQuota: 1 },
            { id: 4, department: 'Kimya Mühendisliği', faculty: 'Mühendislik Fakültesi', quota: 5, filledQuota: 0 },
            { id: 5, department: 'İnşaat Mühendisliği', faculty: 'Mühendislik Fakültesi', quota: 5, filledQuota: 2 },
            { id: 6, department: 'Mimarlık', faculty: 'Mimarlık Fakültesi', quota: 5, filledQuota: 1 },
            { id: 7, department: 'Şehir ve Bölge Planlama', faculty: 'Mimarlık Fakültesi', quota: 3, filledQuota: 0 },
            { id: 8, department: 'Moleküler Biyoloji ve Genetik', faculty: 'Fen Fakültesi', quota: 4, filledQuota: 1 },
            { id: 9, department: 'Fizik', faculty: 'Fen Fakültesi', quota: 5, filledQuota: 0 },
            { id: 10, department: 'Kimya', faculty: 'Fen Fakültesi', quota: 4, filledQuota: 0 },
            { id: 11, department: 'Matematik', faculty: 'Fen Fakültesi', quota: 3, filledQuota: 0 }
        ]);
    }

    showEditDialog(quota: DepartmentQuota) {
        this.selectedQuota = quota;
        this.editQuota = quota.quota;
        this.dialogVisible = true;
    }

    saveQuota() {
        if (this.selectedQuota) {
            // This would typically call a quota management service
            this.selectedQuota.quota = this.editQuota;
            this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Kontenjan güncellendi.' });
            this.dialogVisible = false;
        }
    }
}
