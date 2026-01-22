import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ApplicationService, NotificationService, AuthService } from '../../../../core/services';
import { Application, Notification, ApplicationStatus } from '../../../../core/models';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TableModule, TagModule],
    template: `
        <div class="p-4">
            <h2 class="mb-4">Hoş Geldiniz, {{ userName() }}</h2>

            <div class="flex flex-wrap gap-3 mb-4">
                <div class="flex-1" style="min-width: 200px; margin-bottom: 24px;">
                    <p-card styleClass="h-full">
                        <div class="flex flex-column align-items-center gap-2">
                            <span class="text-4xl font-bold text-primary" style="margin-right: 8px;">{{ applications().length }}</span>
                            <span class="text-500">Toplam Başvuru</span>
                        </div>
                    </p-card>
                </div>

                <div class="flex-1" style="min-width: 200px; margin-bottom: 24px;">
                    <p-card styleClass="h-full">
                        <div class="flex flex-column align-items-center gap-2">
                            <span class="text-4xl font-bold text-orange-500" style="margin-right: 8px;">{{ pendingCount() }}</span>
                            <span class="text-500">Bekleyen</span>
                        </div>
                    </p-card>
                </div>

                <div class="flex-1" style="min-width: 200px; margin-bottom: 24px;">
                    <p-card styleClass="h-full">
                        <div class="flex flex-column align-items-center gap-2">
                            <span class="text-4xl font-bold text-green-500" style="margin-right: 8px;">{{ approvedCount() }}</span>
                            <span class="text-500">Onaylanan</span>
                        </div>
                    </p-card>
                </div>

                <div class="flex-1" style="min-width: 200px; margin-bottom: 24px;">
                    <p-card styleClass="h-full">
                        <div class="flex flex-column align-items-center gap-2">
                            <span class="text-4xl font-bold text-blue-500" style="margin-right: 8px;">{{ unreadNotifications() }}</span>
                            <span class="text-500">Okunmamış Bildirim</span>
                        </div>
                    </p-card>
                </div>
            </div>

            <div class="flex flex-wrap gap-4">
                <div class="flex-grow-1" style="min-width: 300px; flex: 2; margin-bottom: 24px;">
                    <p-card header="Son Başvurularım">
                        <p-table [value]="applications().slice(0, 5)" [tableStyle]="{ 'min-width': '50rem' }">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Başvuru No</th>
                                    <th>Hedef Bölüm</th>
                                    <th>Durum</th>
                                    <th>Tarih</th>
                                    <th></th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-app>
                                <tr>
                                    <td>{{ app.applicationNumber }}</td>
                                    <td>{{ app.targetDepartment }}</td>
                                    <td>
                                        <p-tag [value]="getStatusLabel(app.status)" [severity]="getStatusSeverity(app.status)"></p-tag>
                                    </td>
                                    <td>{{ app.createdAt | date:'dd.MM.yyyy' }}</td>
                                    <td>
                                        <p-button icon="pi pi-eye" [text]="true" [routerLink]="['/student/applications', app.id]"></p-button>
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="5" class="text-center">Henüz başvuru yok</td>
                                </tr>
                            </ng-template>
                        </p-table>
                        <div class="mt-3 text-right" *ngIf="applications().length > 5">
                            <p-button label="Tümünü Gör" [text]="true" routerLink="/student/my-applications"></p-button>
                        </div>
                    </p-card>
                </div>

                <div style="min-width: 250px; flex: 1; margin-bottom: 24px;">
                    <p-card header="Hızlı İşlemler">
                        <div class="flex flex-row gap-4" style="width: 100%;">
                            <p-button label="Yeni Başvuru Oluştur" icon="pi pi-plus" [style]="{ flex: '1' }" routerLink="/student/new-application"></p-button>
                            <p-button label="Başvurularımı Gör" icon="pi pi-list" [style]="{ flex: '1' }" severity="secondary" routerLink="/student/my-applications"></p-button>
                            <p-button label="Sonuçlarım" icon="pi pi-check-circle" [style]="{ flex: '1' }" severity="success" routerLink="/student/results"></p-button>
                            <p-button label="Bildirimlerim" icon="pi pi-bell" [style]="{ flex: '1' }" severity="info" routerLink="/student/notifications"></p-button>
                        </div>
                    </p-card>
                </div>
            </div>
        </div>
    `
})
export class StudentDashboardComponent implements OnInit {
    applications = signal<Application[]>([]);
    unreadNotifications = signal<number>(0);

    userName = signal<string>('');
    pendingCount = signal<number>(0);
    approvedCount = signal<number>(0);

    constructor(
        private applicationService: ApplicationService,
        private notificationService: NotificationService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        const user = this.authService.user();
        this.userName.set(user ? `${user.firstName} ${user.lastName}` : '');

        this.loadApplications();
        this.loadNotificationCount();
    }

    private loadApplications() {
        this.applicationService.getAll().subscribe(apps => {
            this.applications.set(apps);
            this.pendingCount.set(apps.filter(a =>
                ![ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(a.status)
            ).length);
            this.approvedCount.set(apps.filter(a => a.status === ApplicationStatus.APPROVED).length);
        });
    }

    private loadNotificationCount() {
        this.notificationService.getUnreadCount().subscribe(res => {
            this.unreadNotifications.set(res.count);
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
}
