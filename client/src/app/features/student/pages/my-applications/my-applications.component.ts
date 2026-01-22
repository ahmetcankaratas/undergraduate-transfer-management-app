import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ApplicationService } from '../../../../core/services';
import { Application, ApplicationStatus } from '../../../../core/models';

@Component({
    selector: 'app-my-applications',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule, TagModule, InputTextModule],
    styles: [`
        .ranking-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .rank-number {
            font-weight: 600;
            font-size: 0.95rem;
        }
        .rank-number.primary {
            color: #2e7d32;
        }
        .rank-number.waitlisted {
            color: #f57c00;
        }
        .rank-rejected {
            color: #d32f2f;
            font-size: 0.85rem;
        }
        .rank-type {
            color: #666;
            font-size: 0.75rem;
        }
    `],
    template: `
        <div class="grid">
            <div class="col-12">
                <p-card header="Başvurularım">
                    <p-table
                        [value]="applications()"
                        [paginator]="true"
                        [rows]="10"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first} - {last} / {totalRecords} başvuru"
                        [globalFilterFields]="['applicationNumber', 'targetDepartment', 'targetFaculty']"
                        #dt
                    >
                        <ng-template pTemplate="caption">
                            <div class="flex justify-content-between">
                                <p-button label="Yeni Başvuru" icon="pi pi-plus" routerLink="/student/new-application"></p-button>
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Ara..." />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th pSortableColumn="applicationNumber">Başvuru No <p-sortIcon field="applicationNumber"></p-sortIcon></th>
                                <th pSortableColumn="targetFaculty">Fakülte <p-sortIcon field="targetFaculty"></p-sortIcon></th>
                                <th pSortableColumn="targetDepartment">Bölüm <p-sortIcon field="targetDepartment"></p-sortIcon></th>
                                <th pSortableColumn="status">Durum <p-sortIcon field="status"></p-sortIcon></th>
                                <th>Sıralama</th>
                                <th pSortableColumn="createdAt">Tarih <p-sortIcon field="createdAt"></p-sortIcon></th>
                                <th>İşlemler</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-app>
                            <tr>
                                <td>{{ app.applicationNumber }}</td>
                                <td>{{ app.targetFaculty }}</td>
                                <td>{{ app.targetDepartment }}</td>
                                <td>
                                    <p-tag [value]="getStatusLabel(app.status)" [severity]="getStatusSeverity(app.status)"></p-tag>
                                </td>
                                <td>
                                    <div *ngIf="getRankingInfo(app) as rankInfo" class="ranking-info">
                                        <span *ngIf="rankInfo.rank > 0" class="rank-number" [class.primary]="rankInfo.isPrimary" [class.waitlisted]="rankInfo.isWaitlisted">
                                            {{ rankInfo.rank }}. sıra
                                        </span>
                                        <span *ngIf="rankInfo.rank === 0" class="rank-rejected">
                                            Değerlendirme dışı
                                        </span>
                                        <small *ngIf="rankInfo.rank > 0" class="rank-type">
                                            {{ rankInfo.isPrimary ? '(Asil)' : '(Yedek)' }}
                                        </small>
                                    </div>
                                    <span *ngIf="!getRankingInfo(app)" class="text-400">-</span>
                                </td>
                                <td>{{ app.createdAt | date:'dd.MM.yyyy HH:mm' }}</td>
                                <td>
                                    <p-button icon="pi pi-eye" [text]="true" [routerLink]="['/student/applications', app.id]" pTooltip="Detay"></p-button>
                                    <p-button
                                        *ngIf="app.status === 'DRAFT'"
                                        icon="pi pi-pencil"
                                        [text]="true"
                                        severity="info"
                                        [routerLink]="['/student/new-application']"
                                        [queryParams]="{edit: app.id}"
                                        pTooltip="Düzenle"
                                    ></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <i class="pi pi-inbox text-4xl text-300 mb-3"></i>
                                    <p class="text-500">Henüz başvurunuz bulunmuyor.</p>
                                    <p-button label="İlk Başvurunuzu Oluşturun" icon="pi pi-plus" routerLink="/student/new-application"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>
    `
})
export class MyApplicationsComponent implements OnInit {
    applications = signal<Application[]>([]);

    constructor(private applicationService: ApplicationService) {}

    ngOnInit() {
        this.loadApplications();
    }

    private loadApplications() {
        this.applicationService.getAll().subscribe(apps => {
            this.applications.set(apps);
        });
    }

    getStatusLabel(status: ApplicationStatus): string {
        const labels: Record<ApplicationStatus, string> = {
            [ApplicationStatus.DRAFT]: 'Taslak',
            [ApplicationStatus.SUBMITTED]: 'Gönderildi',
            [ApplicationStatus.OIDB_REVIEW]: 'İnceleniyor',
            [ApplicationStatus.FACULTY_ROUTING]: 'Fakültede',
            [ApplicationStatus.DEPARTMENT_ROUTING]: 'Bölümde',
            [ApplicationStatus.YGK_EVALUATION]: 'Değerlendirmede',
            [ApplicationStatus.RANKED]: 'Sıralandı',
            [ApplicationStatus.FACULTY_BOARD]: 'Kurulda',
            [ApplicationStatus.APPROVED]: 'Onaylandı',
            [ApplicationStatus.REJECTED]: 'Reddedildi',
            [ApplicationStatus.WAITLISTED]: 'Yedek Liste'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: ApplicationStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        const severities: Record<ApplicationStatus, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            [ApplicationStatus.DRAFT]: 'secondary',
            [ApplicationStatus.SUBMITTED]: 'info',
            [ApplicationStatus.OIDB_REVIEW]: 'info',
            [ApplicationStatus.FACULTY_ROUTING]: 'info',
            [ApplicationStatus.DEPARTMENT_ROUTING]: 'info',
            [ApplicationStatus.YGK_EVALUATION]: 'warn',
            [ApplicationStatus.RANKED]: 'warn',
            [ApplicationStatus.FACULTY_BOARD]: 'warn',
            [ApplicationStatus.APPROVED]: 'success',
            [ApplicationStatus.REJECTED]: 'danger',
            [ApplicationStatus.WAITLISTED]: 'contrast'
        };
        return severities[status];
    }

    getRankingInfo(app: Application): { rank: number; isPrimary: boolean; isWaitlisted: boolean; quota: number; score: number } | null {
        if (!app.rankings || app.rankings.length === 0) {
            return null;
        }
        // Get the primary ranking (there should be one per application per period)
        const ranking = app.rankings[0];
        return {
            rank: ranking.rank,
            isPrimary: ranking.isPrimary,
            isWaitlisted: ranking.isWaitlisted,
            quota: ranking.quota || 0,
            score: ranking.score
        };
    }
}
