import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { YgkService, Ranking } from '../../services/ygk.service';
import { Application } from '../../../../core/models';

interface DepartmentRankingInfo {
    department: string;
    faculty: string;
    evaluatedCount: number;
    rankedCount: number;
    quota: number;
    hasRankings: boolean;
    isPublished: boolean;
}

@Component({
    selector: 'app-rankings',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, TagModule, DialogModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="rankings-container">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <h1>Sıralama ve Sonuç Yönetimi</h1>
                    <p class="subtitle">Değerlendirilen başvuruları sıralayın ve sonuçları yayınlayın</p>
                </div>
            </div>

            <!-- Departments Grid -->
            <div class="departments-grid">
                <div
                    *ngFor="let dept of departments()"
                    class="department-card"
                    [class.has-rankings]="dept.hasRankings"
                    [class.published]="dept.isPublished"
                >
                    <div class="dept-header">
                        <div class="dept-info">
                            <h3>{{ dept.department }}</h3>
                            <span class="faculty">{{ dept.faculty }}</span>
                        </div>
                        <div class="dept-status">
                            <span class="status-badge" [class.ready]="dept.evaluatedCount > 0" [class.ranked]="dept.hasRankings" [class.published]="dept.isPublished">
                                {{ getDeptStatus(dept) }}
                            </span>
                        </div>
                    </div>

                    <div class="dept-stats">
                        <div class="stat">
                            <span class="stat-value">{{ dept.evaluatedCount }}</span>
                            <span class="stat-label">Değerlendirilen</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">{{ dept.quota }}</span>
                            <span class="stat-label">Kontenjan</span>
                        </div>
                        <div class="stat" *ngIf="dept.hasRankings">
                            <span class="stat-value">{{ dept.rankedCount }}</span>
                            <span class="stat-label">Sıralanan</span>
                        </div>
                    </div>

                    <div class="dept-actions">
                        <button
                            *ngIf="!dept.hasRankings && dept.evaluatedCount > 0"
                            class="btn-primary"
                            (click)="generateRankings(dept)"
                        >
                            <i class="pi pi-chart-bar"></i>
                            Sıralama Oluştur
                        </button>
                        <button
                            *ngIf="dept.hasRankings"
                            class="btn-secondary"
                            (click)="viewRankings(dept)"
                        >
                            <i class="pi pi-eye"></i>
                            Sıralamayı Görüntüle
                        </button>
                        <button
                            *ngIf="dept.hasRankings && !dept.isPublished"
                            class="btn-success"
                            (click)="sendToFacultyBoard(dept)"
                        >
                            <i class="pi pi-send"></i>
                            Öğrenci İşlerine Gönder
                        </button>
                    </div>
                </div>

                <div *ngIf="departments().length === 0" class="empty-state">
                    <i class="pi pi-chart-bar"></i>
                    <h3>Değerlendirilen başvuru yok</h3>
                    <p>Sıralama oluşturmak için önce başvuruları değerlendirin.</p>
                </div>
            </div>
        </div>

        <!-- Ranking Dialog -->
        <p-dialog
            [(visible)]="rankingDialogVisible"
            [modal]="true"
            [style]="{width: '900px', maxHeight: '85vh'}"
            [showHeader]="false"
            styleClass="ranking-dialog"
        >
            <div class="dialog-content" *ngIf="selectedDepartment">
                <!-- Dialog Header -->
                <div class="dialog-header">
                    <div class="dialog-title">
                        <h2>{{ selectedDepartment.department }}</h2>
                        <span class="period">{{ applicationPeriod }} Dönemi</span>
                    </div>
                    <button class="close-btn" (click)="closeDialog()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <!-- Summary -->
                <div class="ranking-summary">
                    <div class="summary-item primary">
                        <span class="summary-value">{{ getPrimaryCount() }}</span>
                        <span class="summary-label">Asil</span>
                    </div>
                    <div class="summary-item waitlist">
                        <span class="summary-value">{{ getWaitlistCount() }}</span>
                        <span class="summary-label">Yedek</span>
                    </div>
                    <div class="summary-item quota">
                        <span class="summary-value">{{ selectedDepartment.quota }}</span>
                        <span class="summary-label">Kontenjan</span>
                    </div>
                </div>

                <!-- Rankings List -->
                <div class="rankings-list">
                    <div class="list-header">
                        <span class="col-rank">Sıra</span>
                        <span class="col-student">Öğrenci</span>
                        <span class="col-university">Mevcut Üniversite</span>
                        <span class="col-score">Puan</span>
                        <span class="col-status">Durum</span>
                    </div>
                    <div
                        *ngFor="let ranking of currentRankings(); let i = index"
                        class="ranking-row"
                        [class.primary]="ranking.isPrimary"
                        [class.waitlist]="ranking.isWaitlisted"
                    >
                        <span class="col-rank">
                            <span class="rank-number">{{ ranking.rank }}</span>
                        </span>
                        <span class="col-student">
                            <div class="student-info">
                                <span class="student-name">{{ ranking.application?.student?.user?.firstName }} {{ ranking.application?.student?.user?.lastName }}</span>
                                <span class="app-number">{{ ranking.application?.applicationNumber }}</span>
                            </div>
                        </span>
                        <span class="col-university">{{ ranking.application?.student?.currentUniversity }}</span>
                        <span class="col-score">
                            <span class="score-value">{{ ranking.score | number:'1.2-2' }}</span>
                        </span>
                        <span class="col-status">
                            <span class="status-tag" [class.asil]="ranking.isPrimary" [class.yedek]="ranking.isWaitlisted">
                                {{ ranking.isPrimary ? 'ASİL' : 'YEDEK' }}
                            </span>
                        </span>
                    </div>

                    <div *ngIf="currentRankings().length === 0" class="empty-rankings">
                        <i class="pi pi-info-circle"></i>
                        <span>Henüz sıralama oluşturulmamış</span>
                    </div>
                </div>

                <!-- Dialog Footer -->
                <div class="dialog-footer">
                    <button class="btn-secondary" (click)="closeDialog()">
                        <i class="pi pi-times"></i>
                        Kapat
                    </button>
                    <button
                        *ngIf="currentRankings().length > 0 && !selectedDepartment.isPublished"
                        class="btn-success"
                        (click)="sendToFacultyBoard(selectedDepartment)"
                    >
                        <i class="pi pi-send"></i>
                        Öğrenci İşlerine Gönder
                    </button>
                </div>
            </div>
        </p-dialog>
    `,
    styles: [`
        .rankings-container {
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

        /* Departments Grid */
        .departments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
        }

        .department-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid #f0f0f0;
            transition: all 0.2s;
        }

        .department-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08);
        }

        .department-card.has-rankings {
            border-color: #8B1538;
        }

        .department-card.published {
            border-color: #16a34a;
        }

        .dept-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.25rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .dept-info h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
        }

        .dept-info .faculty {
            font-size: 0.85rem;
            color: #6b7280;
        }

        .status-badge {
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .status-badge.ready {
            background: #fef3c7;
            color: #d97706;
        }

        .status-badge.ranked {
            background: #dbeafe;
            color: #2563eb;
        }

        .status-badge.published {
            background: #dcfce7;
            color: #16a34a;
        }

        .dept-stats {
            display: flex;
            justify-content: space-around;
            padding: 1.25rem;
            gap: 1rem;
        }

        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
        }

        .stat-label {
            font-size: 0.8rem;
            color: #6b7280;
        }

        .dept-actions {
            display: flex;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: #fafafa;
            border-top: 1px solid #f0f0f0;
        }

        /* Buttons */
        .btn-primary, .btn-secondary, .btn-success {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1rem;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            flex: 1;
            justify-content: center;
        }

        .btn-primary {
            background: #8B1538;
            color: white;
        }

        .btn-primary:hover {
            background: #6d1029;
        }

        .btn-secondary {
            background: white;
            color: #374151;
            border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
            background: #f3f4f6;
        }

        .btn-success {
            background: #16a34a;
            color: white;
        }

        .btn-success:hover {
            background: #15803d;
        }

        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 4rem 2rem;
            background: #f9fafb;
            border-radius: 16px;
            border: 2px dashed #e5e7eb;
        }

        .empty-state i {
            font-size: 4rem;
            color: #9ca3af;
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

        /* Dialog Styles */
        :host ::ng-deep .ranking-dialog .p-dialog-content {
            padding: 0 !important;
            border-radius: 16px;
            overflow: hidden;
        }

        .dialog-content {
            max-height: 80vh;
            overflow-y: auto;
        }

        .dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            background: linear-gradient(135deg, #8B1538 0%, #6d1029 100%);
            color: white;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .dialog-title h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
        }

        .dialog-title .period {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .close-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .close-btn:hover {
            background: rgba(255,255,255,0.2);
        }

        .ranking-summary {
            display: flex;
            justify-content: center;
            gap: 2rem;
            padding: 1.5rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .summary-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem 2rem;
            border-radius: 12px;
        }

        .summary-item.primary {
            background: #dcfce7;
        }

        .summary-item.primary .summary-value {
            color: #16a34a;
        }

        .summary-item.waitlist {
            background: #fef3c7;
        }

        .summary-item.waitlist .summary-value {
            color: #d97706;
        }

        .summary-item.quota {
            background: #dbeafe;
        }

        .summary-item.quota .summary-value {
            color: #2563eb;
        }

        .summary-value {
            font-size: 2rem;
            font-weight: 700;
        }

        .summary-label {
            font-size: 0.85rem;
            color: #6b7280;
        }

        /* Rankings List */
        .rankings-list {
            padding: 0 2rem;
        }

        .list-header {
            display: grid;
            grid-template-columns: 60px 1fr 1fr 100px 100px;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 2px solid #e5e7eb;
            font-weight: 600;
            color: #6b7280;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .ranking-row {
            display: grid;
            grid-template-columns: 60px 1fr 1fr 100px 100px;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid #f0f0f0;
            align-items: center;
            transition: background 0.2s;
        }

        .ranking-row:hover {
            background: #fafafa;
        }

        .ranking-row.primary {
            background: #f0fdf4;
        }

        .ranking-row.waitlist {
            background: #fffbeb;
        }

        .rank-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: #8B1538;
            color: white;
            border-radius: 50%;
            font-weight: 700;
        }

        .student-info {
            display: flex;
            flex-direction: column;
        }

        .student-name {
            font-weight: 600;
            color: #1f2937;
        }

        .app-number {
            font-size: 0.8rem;
            color: #6b7280;
            font-family: 'JetBrains Mono', monospace;
        }

        .score-value {
            font-weight: 700;
            font-size: 1.1rem;
            color: #1f2937;
        }

        .status-tag {
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-tag.asil {
            background: #16a34a;
            color: white;
        }

        .status-tag.yedek {
            background: #d97706;
            color: white;
        }

        .empty-rankings {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 3rem;
            color: #9ca3af;
        }

        .empty-rankings i {
            font-size: 2rem;
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding: 1.5rem 2rem;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            position: sticky;
            bottom: 0;
        }

        .dialog-footer .btn-secondary,
        .dialog-footer .btn-success {
            flex: none;
            padding: 0.75rem 1.5rem;
        }

        @media (max-width: 768px) {
            .departments-grid {
                grid-template-columns: 1fr;
            }

            .list-header,
            .ranking-row {
                grid-template-columns: 50px 1fr 80px;
            }

            .col-university {
                display: none;
            }

            .col-status {
                display: none;
            }
        }
    `]
})
export class RankingsComponent implements OnInit {
    departments = signal<DepartmentRankingInfo[]>([]);
    currentRankings = signal<Ranking[]>([]);
    rankingDialogVisible = false;
    selectedDepartment: DepartmentRankingInfo | null = null;

    private readonly applicationPeriod = this.getCurrentApplicationPeriod();

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

    private loadDepartments() {
        // Get departments with evaluated applications
        this.ygkService.getPendingDepartments().subscribe({
            next: async (depts) => {
                // For each department, check if there are completed evaluations
                const departmentInfos: DepartmentRankingInfo[] = [];

                // Also load rankings for each department
                for (const dept of depts) {
                    try {
                        const rankings = await this.ygkService.getRankings(dept.department, this.applicationPeriod).toPromise();
                        departmentInfos.push({
                            department: dept.department,
                            faculty: dept.faculty,
                            evaluatedCount: dept.count,
                            rankedCount: rankings?.length || 0,
                            quota: this.getQuotaForDepartment(dept.department),
                            hasRankings: (rankings?.length || 0) > 0,
                            isPublished: rankings?.some(r => r.isPublished) || false
                        });
                    } catch {
                        departmentInfos.push({
                            department: dept.department,
                            faculty: dept.faculty,
                            evaluatedCount: dept.count,
                            rankedCount: 0,
                            quota: this.getQuotaForDepartment(dept.department),
                            hasRankings: false,
                            isPublished: false
                        });
                    }
                }

                this.departments.set(departmentInfos);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Bölümler yüklenirken hata oluştu.'
                });
            }
        });
    }

    private getQuotaForDepartment(department: string): number {
        // Default quotas - in production, fetch from API
        const quotas: Record<string, number> = {
            'Bilgisayar Mühendisliği': 5,
            'Elektrik-Elektronik Mühendisliği': 4,
            'Makine Mühendisliği': 3,
            'Kimya Mühendisliği': 2,
            'İnşaat Mühendisliği': 3,
            'Mimarlık': 3,
            'Şehir ve Bölge Planlama': 2,
            'Endüstriyel Tasarım': 2,
            'Fizik': 5,
            'Kimya': 4,
            'Matematik': 4,
            'Moleküler Biyoloji ve Genetik': 3
        };
        return quotas[department] || 3;
    }

    getDeptStatus(dept: DepartmentRankingInfo): string {
        if (dept.isPublished) return 'Yayınlandı';
        if (dept.hasRankings) return 'Sıralandı';
        if (dept.evaluatedCount > 0) return 'Değerlendirildi';
        return 'Bekliyor';
    }

    generateRankings(dept: DepartmentRankingInfo) {
        this.confirmationService.confirm({
            message: `${dept.department} için sıralama oluşturulacak. Devam etmek istiyor musunuz?`,
            header: 'Sıralama Oluştur',
            icon: 'pi pi-chart-bar',
            accept: () => {
                this.ygkService.generateRankings(dept.department, dept.faculty, this.applicationPeriod).subscribe({
                    next: (result) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Başarılı',
                            detail: `${result.primary} asil, ${result.waitlisted} yedek olmak üzere ${result.rankings.length} başvuru sıralandı.`
                        });
                        this.loadDepartments();
                        this.viewRankings(dept);
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Hata',
                            detail: err.error?.message || 'Sıralama oluşturulamadı.'
                        });
                    }
                });
            }
        });
    }

    viewRankings(dept: DepartmentRankingInfo) {
        this.selectedDepartment = dept;
        this.ygkService.getRankings(dept.department, this.applicationPeriod).subscribe({
            next: (rankings) => {
                this.currentRankings.set(rankings);
                this.rankingDialogVisible = true;
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

    sendToFacultyBoard(dept: DepartmentRankingInfo) {
        this.confirmationService.confirm({
            message: `${dept.department} sıralama sonuçları Öğrenci İşlerine gönderilecek. Devam etmek istiyor musunuz?`,
            header: 'Öğrenci İşlerine Gönder',
            icon: 'pi pi-send',
            accept: () => {
                this.ygkService.sendToFacultyBoard(dept.department, this.applicationPeriod).subscribe({
                    next: (result) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Başarılı',
                            detail: result.message
                        });
                        this.loadDepartments();
                        this.closeDialog();
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Hata',
                            detail: err.error?.message || 'Gönderim başarısız.'
                        });
                    }
                });
            }
        });
    }

    closeDialog() {
        this.rankingDialogVisible = false;
        this.selectedDepartment = null;
        this.currentRankings.set([]);
    }

    getPrimaryCount(): number {
        return this.currentRankings().filter(r => r.isPrimary).length;
    }

    getWaitlistCount(): number {
        return this.currentRankings().filter(r => r.isWaitlisted).length;
    }
}
