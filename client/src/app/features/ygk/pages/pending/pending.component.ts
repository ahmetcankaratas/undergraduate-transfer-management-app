import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { YgkService } from '../../services/ygk.service';
import { Application } from '../../../../core/models';

interface DepartmentSummary {
    department: string;
    faculty: string;
    count: number;
}

@Component({
    selector: 'app-pending',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, TableModule, ButtonModule, TagModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="pending-container">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <h1>Bekleyen Başvurular</h1>
                    <p class="subtitle">YGK değerlendirmesi bekleyen başvuruları yönetin</p>
                </div>
                <div class="header-stats">
                    <div class="stat-item primary">
                        <span class="stat-value">{{ totalPending() }}</span>
                        <span class="stat-label">Toplam Bekleyen</span>
                    </div>
                    <div class="stat-item secondary">
                        <span class="stat-value">{{ departmentCount() }}</span>
                        <span class="stat-label">Bölüm</span>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="content-grid">
                <!-- Bölüm Özeti Sidebar -->
                <div class="sidebar">
                    <div class="sidebar-card">
                        <div class="sidebar-header">
                            <i class="pi pi-building"></i>
                            <span>Bölümlere Göre Dağılım</span>
                        </div>
                        <div class="department-list">
                            <div
                                *ngFor="let dept of departmentSummary()"
                                class="department-item"
                                [class.active]="selectedDepartment === dept.department"
                                (click)="filterByDepartment(dept.department)"
                            >
                                <div class="dept-info">
                                    <span class="dept-name">{{ dept.department }}</span>
                                    <span class="dept-faculty">{{ dept.faculty }}</span>
                                </div>
                                <span class="dept-count">{{ dept.count }}</span>
                            </div>
                            <div *ngIf="departmentSummary().length === 0" class="empty-departments">
                                <i class="pi pi-inbox"></i>
                                <span>Bekleyen başvuru yok</span>
                            </div>
                        </div>
                        <button
                            *ngIf="selectedDepartment"
                            class="clear-filter-btn"
                            (click)="clearFilter()"
                        >
                            <i class="pi pi-times"></i>
                            Filtreyi Temizle
                        </button>
                    </div>
                </div>

                <!-- Başvuru Listesi -->
                <div class="main-content">
                    <div class="applications-card">
                        <div class="card-header">
                            <div class="header-title">
                                <i class="pi pi-list"></i>
                                <span>Başvuru Listesi</span>
                            </div>
                            <span class="result-count" *ngIf="selectedDepartment">
                                {{ filteredApplications().length }} başvuru gösteriliyor
                            </span>
                        </div>

                        <!-- Applications Grid -->
                        <div class="applications-list">
                            <div
                                *ngFor="let app of filteredApplications()"
                                class="application-row"
                                (click)="goToEvaluate(app)"
                            >
                                <div class="app-main">
                                    <div class="app-number">{{ app.applicationNumber }}</div>
                                    <div class="app-student">
                                        <i class="pi pi-user"></i>
                                        <span>{{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}</span>
                                    </div>
                                    <div class="app-university">
                                        <i class="pi pi-building"></i>
                                        <span>{{ app.student?.currentUniversity }}</span>
                                    </div>
                                </div>
                                <div class="app-target">
                                    <div class="target-dept">{{ app.targetDepartment }}</div>
                                    <div class="target-faculty">{{ app.targetFaculty }}</div>
                                </div>
                                <div class="app-meta">
                                    <div class="gpa-badge" [class.high]="(app.declaredGpa ?? 0) >= 3.5" [class.medium]="(app.declaredGpa ?? 0) >= 3.0 && (app.declaredGpa ?? 0) < 3.5" [class.low]="(app.declaredGpa ?? 0) < 3.0">
                                        <span class="gpa-label">GPA</span>
                                        <span class="gpa-value">{{ app.declaredGpa?.toFixed(2) || '-' }}</span>
                                    </div>
                                    <div class="app-date">
                                        <i class="pi pi-calendar"></i>
                                        {{ app.createdAt | date:'dd.MM.yyyy' }}
                                    </div>
                                </div>
                                <div class="app-action">
                                    <button class="evaluate-btn">
                                        <i class="pi pi-pencil"></i>
                                        Değerlendir
                                    </button>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div *ngIf="filteredApplications().length === 0" class="empty-state">
                                <i class="pi pi-check-circle"></i>
                                <h3>Bekleyen başvuru yok</h3>
                                <p>Şu anda değerlendirilecek başvuru bulunmuyor.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .pending-container {
            padding: 1.5rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Page Header */
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .header-content h1 {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
            color: #1f2937;
        }

        .subtitle {
            margin: 0.5rem 0 0 0;
            color: #6b7280;
            font-size: 0.95rem;
        }

        .header-stats {
            display: flex;
            gap: 1rem;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            min-width: 120px;
        }

        .stat-item.primary {
            background: linear-gradient(135deg, #8B1538 0%, #6d1029 100%);
            color: white;
        }

        .stat-item.secondary {
            background: #f3f4f6;
            color: #374151;
        }

        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 0.8rem;
            opacity: 0.9;
        }

        /* Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 1.5rem;
        }

        /* Sidebar */
        .sidebar-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid #f0f0f0;
            position: sticky;
            top: 1.5rem;
        }

        .sidebar-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.25rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #374151;
        }

        .sidebar-header i {
            color: #8B1538;
        }

        .department-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .department-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 1px solid #f0f0f0;
        }

        .department-item:last-child {
            border-bottom: none;
        }

        .department-item:hover {
            background: #f9fafb;
        }

        .department-item.active {
            background: linear-gradient(135deg, rgba(139, 21, 56, 0.08) 0%, rgba(109, 16, 41, 0.08) 100%);
            border-left: 3px solid #8B1538;
        }

        .dept-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .dept-name {
            font-weight: 500;
            color: #1f2937;
            font-size: 0.95rem;
        }

        .dept-faculty {
            font-size: 0.8rem;
            color: #9ca3af;
        }

        .dept-count {
            background: #8B1538;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .empty-departments {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 2rem;
            color: #9ca3af;
        }

        .empty-departments i {
            font-size: 2rem;
        }

        .clear-filter-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 1rem;
            background: #f9fafb;
            border: none;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .clear-filter-btn:hover {
            background: #f3f4f6;
            color: #374151;
        }

        /* Main Content */
        .applications-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid #f0f0f0;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .header-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            color: #374151;
        }

        .header-title i {
            color: #8B1538;
        }

        .result-count {
            font-size: 0.9rem;
            color: #6b7280;
            background: #e5e7eb;
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
        }

        /* Applications List */
        .applications-list {
            display: flex;
            flex-direction: column;
        }

        .application-row {
            display: grid;
            grid-template-columns: 1fr 200px 120px auto;
            gap: 1.5rem;
            align-items: center;
            padding: 1.25rem;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: all 0.2s;
        }

        .application-row:last-child {
            border-bottom: none;
        }

        .application-row:hover {
            background: #fafafa;
        }

        .app-main {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .app-number {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 500;
        }

        .app-student {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: #1f2937;
        }

        .app-student i {
            color: #8B1538;
            font-size: 0.9rem;
        }

        .app-university {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: #6b7280;
        }

        .app-university i {
            font-size: 0.8rem;
        }

        .app-target {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .target-dept {
            font-weight: 500;
            color: #8B1538;
        }

        .target-faculty {
            font-size: 0.85rem;
            color: #9ca3af;
        }

        .app-meta {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        .gpa-badge {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.4rem 0.75rem;
            border-radius: 8px;
            background: #f3f4f6;
        }

        .gpa-badge.high { background: #dcfce7; }
        .gpa-badge.high .gpa-value { color: #16a34a; }
        .gpa-badge.medium { background: #fef3c7; }
        .gpa-badge.medium .gpa-value { color: #d97706; }
        .gpa-badge.low { background: #fee2e2; }
        .gpa-badge.low .gpa-value { color: #dc2626; }

        .gpa-label {
            font-size: 0.65rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .gpa-value {
            font-size: 1rem;
            font-weight: 700;
        }

        .app-date {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.8rem;
            color: #9ca3af;
        }

        .app-action {
            display: flex;
            justify-content: flex-end;
        }

        .evaluate-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1rem;
            background: #8B1538;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
        }

        .evaluate-btn:hover {
            background: #6d1029;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
        }

        .empty-state i {
            font-size: 4rem;
            color: #10b981;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            margin: 0 0 0.5rem 0;
            color: #1f2937;
        }

        .empty-state p {
            margin: 0;
            color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .content-grid {
                grid-template-columns: 1fr;
            }

            .sidebar-card {
                position: static;
            }

            .department-list {
                max-height: 200px;
            }

            .application-row {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .app-target,
            .app-meta {
                align-items: flex-start;
            }

            .app-meta {
                flex-direction: row;
                gap: 1rem;
            }

            .app-action {
                justify-content: flex-start;
            }
        }

        @media (max-width: 768px) {
            .page-header {
                flex-direction: column;
                gap: 1rem;
            }

            .header-stats {
                width: 100%;
            }

            .stat-item {
                flex: 1;
            }
        }
    `]
})
export class PendingComponent implements OnInit {
    applications = signal<Application[]>([]);
    departmentSummary = signal<DepartmentSummary[]>([]);
    selectedDepartment: string | null = null;

    totalPending = signal<number>(0);
    departmentCount = signal<number>(0);

    constructor(
        private ygkService: YgkService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadPendingApplications();
        this.loadDepartmentSummary();
    }

    private loadPendingApplications() {
        this.ygkService.getPendingApplications().subscribe({
            next: (apps) => {
                this.applications.set(apps);
                this.totalPending.set(apps.length);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Başvurular yüklenirken hata oluştu.'
                });
            }
        });
    }

    private loadDepartmentSummary() {
        this.ygkService.getPendingDepartments().subscribe({
            next: (summary) => {
                this.departmentSummary.set(summary);
                this.departmentCount.set(summary.length);
            },
            error: () => {
                this.calculateDepartmentSummary();
            }
        });
    }

    private calculateDepartmentSummary() {
        const apps = this.applications();
        const summary: Record<string, DepartmentSummary> = {};

        apps.forEach(app => {
            const key = app.targetDepartment;
            if (!summary[key]) {
                summary[key] = {
                    department: app.targetDepartment,
                    faculty: app.targetFaculty,
                    count: 0
                };
            }
            summary[key].count++;
        });

        this.departmentSummary.set(Object.values(summary));
        this.departmentCount.set(Object.keys(summary).length);
    }

    filteredApplications() {
        const apps = this.applications();
        if (!this.selectedDepartment) {
            return apps;
        }
        return apps.filter(app => app.targetDepartment === this.selectedDepartment);
    }

    filterByDepartment(department: string) {
        this.selectedDepartment = department;
    }

    clearFilter() {
        this.selectedDepartment = null;
    }

    goToEvaluate(app: Application) {
        this.router.navigate(['/ygk/evaluate'], {
            queryParams: { applicationId: app.id }
        });
    }
}
