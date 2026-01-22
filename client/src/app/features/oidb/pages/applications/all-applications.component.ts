import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../../core/services';
import { Application, ApplicationStatus } from '../../../../core/models';

@Component({
    selector: 'app-all-applications',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule, TagModule, SelectModule, InputTextModule, FormsModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <p-card header="Tüm Başvurular">
                    <div class="flex flex-wrap gap-3 mb-3">
                        <p-select
                            [options]="statusOptions"
                            [(ngModel)]="selectedStatus"
                            placeholder="Durum Filtrele"
                            [showClear]="true"
                            (onChange)="loadApplications()"
                        ></p-select>
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input pInputText type="text" [(ngModel)]="searchTerm" placeholder="Ara..." (input)="loadApplications()" />
                        </span>
                    </div>

                    <p-table [value]="applications()" [paginator]="true" [rows]="15" [showCurrentPageReport]="true">
                        <ng-template pTemplate="header">
                            <tr>
                                <th pSortableColumn="applicationNumber">Başvuru No</th>
                                <th>Öğrenci</th>
                                <th pSortableColumn="targetFaculty">Fakülte</th>
                                <th pSortableColumn="targetDepartment">Bölüm</th>
                                <th pSortableColumn="status">Durum</th>
                                <th pSortableColumn="createdAt">Tarih</th>
                                <th>İşlemler</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-app>
                            <tr>
                                <td>{{ app.applicationNumber }}</td>
                                <td>{{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}</td>
                                <td>{{ app.targetFaculty }}</td>
                                <td>{{ app.targetDepartment }}</td>
                                <td>
                                    <p-tag [value]="getStatusLabel(app.status)" [severity]="getStatusSeverity(app.status)"></p-tag>
                                </td>
                                <td>{{ app.createdAt | date:'dd.MM.yyyy' }}</td>
                                <td>
                                    <p-button icon="pi pi-eye" [text]="true" [routerLink]="['/oidb/applications', app.id]"></p-button>
                                    <p-button
                                        *ngIf="app.status === 'OIDB_REVIEW'"
                                        icon="pi pi-send"
                                        [text]="true"
                                        severity="info"
                                        (onClick)="routeToFaculty(app)"
                                        pTooltip="Fakülteye Yönlendir"
                                    ></p-button>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>
    `
})
export class AllApplicationsComponent implements OnInit {
    applications = signal<Application[]>([]);
    selectedStatus: ApplicationStatus | null = null;
    searchTerm = '';

    statusOptions = [
        { label: 'Taslak', value: ApplicationStatus.DRAFT },
        { label: 'Gönderildi', value: ApplicationStatus.SUBMITTED },
        { label: 'İnceleniyor', value: ApplicationStatus.OIDB_REVIEW },
        { label: 'Fakültede', value: ApplicationStatus.FACULTY_ROUTING },
        { label: 'Bölümde', value: ApplicationStatus.DEPARTMENT_ROUTING },
        { label: 'Değerlendirmede', value: ApplicationStatus.YGK_EVALUATION },
        { label: 'Sıralandı', value: ApplicationStatus.RANKED },
        { label: 'Onaylandı', value: ApplicationStatus.APPROVED },
        { label: 'Reddedildi', value: ApplicationStatus.REJECTED }
    ];

    constructor(private applicationService: ApplicationService) {}

    ngOnInit() {
        this.loadApplications();
    }

    loadApplications() {
        const filters: any = {};
        if (this.selectedStatus) filters.status = this.selectedStatus;
        if (this.searchTerm) filters.searchTerm = this.searchTerm;

        this.applicationService.getAll(filters).subscribe(apps => {
            this.applications.set(apps);
        });
    }

    routeToFaculty(app: Application) {
        this.applicationService.routeToFaculty(app.id).subscribe(() => {
            this.loadApplications();
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

    getStatusSeverity(status: ApplicationStatus): any {
        const severities: Record<ApplicationStatus, string> = {
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
}
