import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { YgkService, Ranking } from '../../services/ygk.service';

interface DepartmentOption {
    label: string;
    value: string;
    faculty: string;
}

@Component({
    selector: 'app-results',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        TagModule,
        ToastModule,
        SelectModule,
        DialogModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="grid">
            <!-- Filtre ve Özet -->
            <div class="col-12">
                <p-card>
                    <div class="flex flex-wrap gap-3 align-items-end">
                        <div class="flex flex-column gap-2">
                            <label for="department">Bölüm</label>
                            <p-select
                                id="department"
                                [options]="departmentOptions()"
                                [(ngModel)]="selectedDepartment"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Bölüm Seçin"
                                [style]="{width: '300px'}"
                                (onChange)="loadRankings()"
                            ></p-select>
                        </div>
                        <div class="flex flex-column gap-2">
                            <label for="period">Başvuru Dönemi</label>
                            <p-select
                                id="period"
                                [options]="periodOptions"
                                [(ngModel)]="selectedPeriod"
                                placeholder="Dönem Seçin"
                                [style]="{width: '200px'}"
                                (onChange)="loadRankings()"
                            ></p-select>
                        </div>
                        <p-button
                            label="Sıralamaları Getir"
                            icon="pi pi-search"
                            (onClick)="loadRankings()"
                            [disabled]="!selectedDepartment || !selectedPeriod"
                        ></p-button>
                    </div>
                </p-card>
            </div>

            <!-- İstatistikler -->
            <div class="col-12 md:col-3" *ngIf="rankings().length > 0">
                <p-card styleClass="h-full">
                    <div class="flex align-items-center justify-content-between">
                        <div>
                            <span class="block text-500 font-medium mb-3">Toplam</span>
                            <div class="text-900 font-medium text-4xl">{{ rankings().length }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-users text-blue-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>
            <div class="col-12 md:col-3" *ngIf="rankings().length > 0">
                <p-card styleClass="h-full">
                    <div class="flex align-items-center justify-content-between">
                        <div>
                            <span class="block text-500 font-medium mb-3">Asil</span>
                            <div class="text-900 font-medium text-4xl text-green-500">{{ primaryCount() }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-check-circle text-green-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>
            <div class="col-12 md:col-3" *ngIf="rankings().length > 0">
                <p-card styleClass="h-full">
                    <div class="flex align-items-center justify-content-between">
                        <div>
                            <span class="block text-500 font-medium mb-3">Yedek</span>
                            <div class="text-900 font-medium text-4xl text-orange-500">{{ waitlistedCount() }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-clock text-orange-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>
            <div class="col-12 md:col-3" *ngIf="rankings().length > 0">
                <p-card styleClass="h-full">
                    <div class="flex align-items-center justify-content-between">
                        <div>
                            <span class="block text-500 font-medium mb-3">Kontenjan</span>
                            <div class="text-900 font-medium text-4xl">{{ quota() }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-hashtag text-purple-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Sıralama Tablosu -->
            <div class="col-12">
                <p-card header="Sıralama Sonuçları">
                    <ng-template pTemplate="header">
                        <div class="flex justify-content-between align-items-center px-3 pt-3">
                            <span class="text-xl font-semibold">Sıralama Sonuçları</span>
                            <div class="flex gap-2" *ngIf="rankings().length > 0">
                                <p-button
                                    label="Fakülte Kuruluna Gönder"
                                    icon="pi pi-send"
                                    severity="success"
                                    (onClick)="sendToFacultyBoard()"
                                ></p-button>
                            </div>
                        </div>
                    </ng-template>

                    <p-table
                        [value]="rankings()"
                        [paginator]="true"
                        [rows]="20"
                        [rowsPerPageOptions]="[10, 20, 50]"
                        styleClass="p-datatable-sm p-datatable-striped"
                    >
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 60px">Sıra</th>
                                <th>Başvuru No</th>
                                <th>Öğrenci</th>
                                <th>Puan</th>
                                <th>Durum</th>
                                <th>Yayın</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-ranking let-i="rowIndex">
                            <tr [class.surface-100]="ranking.isPrimary">
                                <td>
                                    <span
                                        class="flex align-items-center justify-content-center border-round font-bold"
                                        [class.bg-green-500]="ranking.isPrimary"
                                        [class.bg-orange-500]="ranking.isWaitlisted"
                                        [class.text-white]="true"
                                        style="width: 2rem; height: 2rem"
                                    >
                                        {{ ranking.rank }}
                                    </span>
                                </td>
                                <td>
                                    <span class="font-mono">{{ ranking.application?.applicationNumber }}</span>
                                </td>
                                <td>
                                    <div class="font-medium">
                                        {{ ranking.application?.student?.user?.firstName }}
                                        {{ ranking.application?.student?.user?.lastName }}
                                    </div>
                                    <div class="text-xs text-500">
                                        {{ ranking.application?.student?.currentUniversity }}
                                    </div>
                                </td>
                                <td>
                                    <span class="font-bold text-lg">{{ ranking.score?.toFixed(2) }}</span>
                                </td>
                                <td>
                                    <p-tag
                                        [value]="ranking.isPrimary ? 'Asil' : 'Yedek'"
                                        [severity]="ranking.isPrimary ? 'success' : 'warn'"
                                    ></p-tag>
                                </td>
                                <td>
                                    <i
                                        class="pi"
                                        [class.pi-check-circle]="ranking.isPublished"
                                        [class.pi-clock]="!ranking.isPublished"
                                        [class.text-green-500]="ranking.isPublished"
                                        [class.text-400]="!ranking.isPublished"
                                    ></i>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center p-4">
                                    <div class="flex flex-column align-items-center gap-2">
                                        <i class="pi pi-list text-4xl text-300"></i>
                                        <p class="text-500 m-0">
                                            {{ selectedDepartment ? 'Sıralama bulunamadı.' : 'Lütfen bölüm ve dönem seçin.' }}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>
    `
})
export class ResultsComponent implements OnInit {
    rankings = signal<Ranking[]>([]);
    departmentOptions = signal<DepartmentOption[]>([]);

    selectedDepartment: string | null = null;
    selectedPeriod: string | null = null;

    periodOptions = this.generatePeriodOptions();

    primaryCount = signal<number>(0);
    waitlistedCount = signal<number>(0);
    quota = signal<number>(0);

    constructor(
        private ygkService: YgkService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadDepartments();
    }

    /**
     * Mevcut başvuru dönemini hesapla
     * (Backend applications.service.ts ile aynı mantık)
     */
    private getCurrentApplicationPeriod(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 0-indexed
        // Güz dönemi: Ağustos-Ocak, Bahar dönemi: Şubat-Temmuz
        const semester = month >= 8 || month <= 1 ? 'Güz' : 'Bahar';
        const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        return `${academicYear}-${semester}`;
    }

    /**
     * Dönem seçeneklerini dinamik olarak oluştur
     */
    private generatePeriodOptions(): { label: string; value: string }[] {
        const currentPeriod = this.getCurrentApplicationPeriod();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Mevcut akademik yılı hesapla
        const currentAcademicYearStart = month >= 8 ? year : year - 1;

        const options: { label: string; value: string }[] = [];

        // Son 3 yılın dönemlerini ekle (mevcut dahil)
        for (let i = 0; i < 3; i++) {
            const academicYearStart = currentAcademicYearStart - i;
            const academicYear = `${academicYearStart}-${academicYearStart + 1}`;

            // Güz dönemi
            options.push({
                label: `${academicYear} Güz`,
                value: `${academicYear}-Güz`
            });

            // Bahar dönemi
            options.push({
                label: `${academicYear} Bahar`,
                value: `${academicYear}-Bahar`
            });
        }

        // Mevcut dönemin seçeneklerde en üstte olması için sırala
        return options.sort((a, b) => b.value.localeCompare(a.value));
    }

    private loadDepartments() {
        this.ygkService.getPendingDepartments().subscribe({
            next: (depts) => {
                const options = depts.map(d => ({
                    label: `${d.department} (${d.faculty})`,
                    value: d.department,
                    faculty: d.faculty
                }));
                this.departmentOptions.set(options);
            },
            error: () => {
                // Fallback departments
                this.departmentOptions.set([
                    { label: 'Bilgisayar Mühendisliği', value: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi' },
                    { label: 'Elektrik-Elektronik Mühendisliği', value: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi' },
                    { label: 'Makine Mühendisliği', value: 'Makine Mühendisliği', faculty: 'Mühendislik Fakültesi' },
                    { label: 'Mimarlık', value: 'Mimarlık', faculty: 'Mimarlık Fakültesi' }
                ]);
            }
        });
    }

    loadRankings() {
        if (!this.selectedDepartment || !this.selectedPeriod) {
            return;
        }

        this.ygkService.getRankings(this.selectedDepartment, this.selectedPeriod).subscribe({
            next: (rankings) => {
                this.rankings.set(rankings);
                this.calculateStats(rankings);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Sıralamalar yüklenirken hata oluştu.'
                });
            }
        });
    }

    private calculateStats(rankings: Ranking[]) {
        this.primaryCount.set(rankings.filter(r => r.isPrimary).length);
        this.waitlistedCount.set(rankings.filter(r => r.isWaitlisted).length);
        if (rankings.length > 0) {
            this.quota.set(rankings[0].quota || 0);
        }
    }

    sendToFacultyBoard() {
        this.confirmationService.confirm({
            message: 'Sıralamalar Fakülte Kuruluna gönderilecek. Devam etmek istiyor musunuz?',
            header: 'Onay',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Evet, Gönder',
            rejectLabel: 'İptal',
            accept: () => {
                if (this.selectedDepartment && this.selectedPeriod) {
                    this.ygkService.sendToFacultyBoard(this.selectedDepartment, this.selectedPeriod).subscribe({
                        next: (result) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Başarılı',
                                detail: result.message || 'Sıralamalar Fakülte Kuruluna gönderildi.'
                            });
                            this.loadRankings();
                        },
                        error: () => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Hata',
                                detail: 'Gönderim sırasında hata oluştu.'
                            });
                        }
                    });
                }
            }
        });
    }
}
