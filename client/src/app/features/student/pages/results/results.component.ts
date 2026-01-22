import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { ApplicationService } from '../../../../core/services';

interface ApplicationResult {
    id: string;
    applicationNumber: string;
    status: string;
    targetDepartment: string;
    targetFaculty: string;
    applicationPeriod: string;
    ranking?: {
        rank: number;
        score: number;
        isPrimary: boolean;
        isWaitlisted: boolean;
        isPublished: boolean;
        publishedAt: Date | null;
        quota: number;
    };
}

@Component({
    selector: 'app-student-results',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TagModule,
        ToastModule,
        ProgressSpinnerModule,
        RouterModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="results-container">
            <!-- Header -->
            <div class="page-header">
                <h1><i class="pi pi-trophy"></i> Başvuru Sonuçlarım</h1>
                <p>Yatay geçiş başvurularınızın sonuçlarını görüntüleyin.</p>
            </div>

            <!-- Loading State -->
            <div class="loading-container" *ngIf="loading()">
                <p-progressSpinner></p-progressSpinner>
                <p>Sonuçlar yükleniyor...</p>
            </div>

            <!-- No Results -->
            <div class="empty-state" *ngIf="!loading() && applications().length === 0">
                <i class="pi pi-file-excel"></i>
                <h3>Henüz Başvuru Yok</h3>
                <p>Henüz bir yatay geçiş başvurunuz bulunmuyor.</p>
                <p-button
                    label="Yeni Başvuru Yap"
                    icon="pi pi-plus"
                    routerLink="/student/new-application"
                ></p-button>
            </div>

            <!-- Results Cards -->
            <div class="results-grid" *ngIf="!loading() && applications().length > 0">
                <div class="result-card" *ngFor="let app of applications()"
                     [class.approved]="app.status === 'APPROVED'"
                     [class.waitlisted]="app.status === 'WAITLISTED'"
                     [class.rejected]="app.status === 'REJECTED'"
                     [class.pending]="!['APPROVED', 'WAITLISTED', 'REJECTED'].includes(app.status)">

                    <!-- Status Banner -->
                    <div class="status-banner" [ngClass]="getStatusClass(app.status)">
                        <i [class]="getStatusIcon(app.status)"></i>
                        <span>{{ getStatusText(app.status) }}</span>
                    </div>

                    <div class="card-content">
                        <!-- Application Info -->
                        <div class="app-info">
                            <div class="app-number">{{ app.applicationNumber }}</div>
                            <div class="app-target">
                                <h3>{{ app.targetDepartment }}</h3>
                                <span class="faculty">{{ app.targetFaculty }}</span>
                            </div>
                            <div class="app-period">
                                <i class="pi pi-calendar"></i>
                                {{ app.applicationPeriod }}
                            </div>
                        </div>

                        <!-- Results Section (if published) -->
                        @if (app.ranking?.isPublished && app.ranking) {
                            <div class="ranking-info">
                                <div class="ranking-header">
                                    <h4>Sıralama Sonucu</h4>
                                    <p-tag
                                        [value]="app.ranking.isPrimary ? 'Asil Aday' : 'Yedek Aday'"
                                        [severity]="app.ranking.isPrimary ? 'success' : 'warn'"
                                        [icon]="app.ranking.isPrimary ? 'pi pi-check-circle' : 'pi pi-clock'"
                                    ></p-tag>
                                </div>

                                <div class="ranking-stats">
                                    <div class="stat">
                                        <span class="stat-label">Sıranız</span>
                                        <span class="stat-value rank">{{ app.ranking.rank }}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Puanınız</span>
                                        <span class="stat-value score">{{ app.ranking.score | number:'1.2-2' }}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Kontenjan</span>
                                        <span class="stat-value quota">{{ app.ranking.quota }}</span>
                                    </div>
                                </div>

                                <!-- Result Message -->
                                @if (app.status === 'APPROVED') {
                                    <div class="result-message">
                                        <i class="pi pi-check-circle"></i>
                                        <div>
                                            <strong>Tebrikler!</strong>
                                            <p>Yatay geçiş başvurunuz kabul edilmiştir. Kayıt işlemleri için ÖİDB ile iletişime geçiniz.</p>
                                        </div>
                                    </div>
                                }

                                @if (app.status === 'WAITLISTED') {
                                    <div class="result-message waitlist">
                                        <i class="pi pi-info-circle"></i>
                                        <div>
                                            <strong>Yedek Listedesiniz</strong>
                                            <p>Asil adaylardan kayıt yaptırmayanlar olması durumunda sıranıza göre yerleştirileceksiniz.</p>
                                        </div>
                                    </div>
                                }

                                @if (app.ranking.publishedAt) {
                                    <div class="published-info">
                                        <i class="pi pi-calendar-times"></i>
                                        Sonuç yayınlanma tarihi: {{ app.ranking.publishedAt | date:'dd.MM.yyyy HH:mm' }}
                                    </div>
                                }
                            </div>
                        }

                        <!-- Pending Section -->
                        <div class="pending-info" *ngIf="!app.ranking?.isPublished && !['APPROVED', 'WAITLISTED', 'REJECTED'].includes(app.status)">
                            <div class="pending-icon">
                                <i class="pi pi-spin pi-spinner"></i>
                            </div>
                            <div class="pending-text">
                                <h4>İşlem Devam Ediyor</h4>
                                <p>{{ getPendingStatusMessage(app.status) }}</p>
                            </div>
                        </div>

                        <!-- Rejected Section -->
                        <div class="rejected-info" *ngIf="app.status === 'REJECTED'">
                            <i class="pi pi-times-circle"></i>
                            <div>
                                <strong>Başvurunuz Reddedildi</strong>
                                <p>Detaylı bilgi için ÖİDB ile iletişime geçebilirsiniz.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info Box -->
            <div class="info-box" *ngIf="!loading() && applications().length > 0">
                <i class="pi pi-info-circle"></i>
                <div>
                    <strong>Bilgilendirme</strong>
                    <p>Sonuçlar ÖİDB tarafından yayınlandıktan sonra bu sayfada görüntülenecektir. Sonuçlarla ilgili sorularınız için ÖİDB ile iletişime geçebilirsiniz.</p>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .results-container {
            padding: 1.5rem;
            max-width: 900px;
            margin: 0 auto;
        }

        .page-header {
            margin-bottom: 2rem;
            text-align: center;
        }

        .page-header h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.75rem;
            color: var(--text-color);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        .page-header h1 i {
            color: var(--primary-color);
        }

        .page-header p {
            margin: 0;
            color: var(--text-color-secondary);
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 4rem;
        }

        .loading-container p {
            margin-top: 1rem;
            color: var(--text-color-secondary);
        }

        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: var(--surface-card);
            border-radius: 12px;
            border: 1px dashed var(--surface-border);
        }

        .empty-state i {
            font-size: 4rem;
            color: var(--text-color-secondary);
            opacity: 0.5;
        }

        .empty-state h3 {
            margin: 1rem 0 0.5rem;
        }

        .empty-state p {
            color: var(--text-color-secondary);
            margin-bottom: 1.5rem;
        }

        .results-grid {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .result-card {
            background: var(--surface-card);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--surface-border);
            transition: all 0.2s;
        }

        .result-card:hover {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .result-card.approved {
            border-color: var(--green-300);
        }

        .result-card.waitlisted {
            border-color: var(--orange-300);
        }

        .result-card.rejected {
            border-color: var(--red-300);
        }

        .status-banner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            font-weight: 600;
            color: white;
        }

        .status-banner.approved {
            background: linear-gradient(135deg, var(--green-500) 0%, var(--green-600) 100%);
        }

        .status-banner.waitlisted {
            background: linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%);
        }

        .status-banner.rejected {
            background: linear-gradient(135deg, var(--red-500) 0%, var(--red-600) 100%);
        }

        .status-banner.pending {
            background: linear-gradient(135deg, var(--blue-500) 0%, var(--blue-600) 100%);
        }

        .card-content {
            padding: 1.5rem;
        }

        .app-info {
            margin-bottom: 1.5rem;
        }

        .app-number {
            font-size: 0.85rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
        }

        .app-target h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.25rem;
            color: var(--text-color);
        }

        .app-target .faculty {
            color: var(--text-color-secondary);
            font-size: 0.9rem;
        }

        .app-period {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.75rem;
            font-size: 0.9rem;
            color: var(--text-color-secondary);
        }

        .ranking-info {
            background: var(--surface-ground);
            border-radius: 8px;
            padding: 1.25rem;
        }

        .ranking-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .ranking-header h4 {
            margin: 0;
            font-size: 1rem;
            color: var(--text-color);
        }

        .ranking-stats {
            display: flex;
            gap: 2rem;
            margin-bottom: 1rem;
        }

        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            margin-bottom: 0.25rem;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .stat-value.rank { color: var(--primary-color); }
        .stat-value.score { color: var(--green-600); }
        .stat-value.quota { color: var(--text-color-secondary); }

        .result-message {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .result-message i {
            font-size: 1.5rem;
            color: var(--green-600);
            flex-shrink: 0;
        }

        .result-message strong {
            color: var(--green-700);
        }

        .result-message p {
            margin: 0.25rem 0 0;
            color: var(--text-color-secondary);
            font-size: 0.9rem;
        }

        .result-message.waitlist {
            background: rgba(249, 115, 22, 0.1);
        }

        .result-message.waitlist i {
            color: var(--orange-600);
        }

        .result-message.waitlist strong {
            color: var(--orange-700);
        }

        .published-info {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .pending-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: var(--surface-ground);
            border-radius: 8px;
        }

        .pending-icon i {
            font-size: 2rem;
            color: var(--primary-color);
        }

        .pending-text h4 {
            margin: 0 0 0.25rem;
        }

        .pending-text p {
            margin: 0;
            color: var(--text-color-secondary);
            font-size: 0.9rem;
        }

        .rejected-info {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 8px;
        }

        .rejected-info i {
            font-size: 1.5rem;
            color: var(--red-600);
        }

        .rejected-info strong {
            color: var(--red-700);
        }

        .rejected-info p {
            margin: 0.25rem 0 0;
            color: var(--text-color-secondary);
            font-size: 0.9rem;
        }

        .info-box {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            padding: 1rem 1.25rem;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 8px;
            border-left: 4px solid var(--blue-500);
        }

        .info-box i {
            color: var(--blue-600);
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .info-box strong {
            color: var(--blue-700);
        }

        .info-box p {
            margin: 0.25rem 0 0;
            color: var(--text-color-secondary);
            font-size: 0.9rem;
        }
    `]
})
export class StudentResultsComponent implements OnInit {
    applications = signal<ApplicationResult[]>([]);
    loading = signal(false);

    constructor(
        private applicationService: ApplicationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadResults();
    }

    loadResults() {
        this.loading.set(true);
        this.applicationService.getMyApplications().subscribe({
            next: (apps: any[]) => {
                // Map applications with their ranking info
                const results: ApplicationResult[] = apps.map(app => ({
                    id: app.id,
                    applicationNumber: app.applicationNumber,
                    status: app.status,
                    targetDepartment: app.targetDepartment,
                    targetFaculty: app.targetFaculty,
                    applicationPeriod: app.applicationPeriod,
                    ranking: app.rankings?.[0] ? {
                        rank: app.rankings[0].rank,
                        score: app.rankings[0].score,
                        isPrimary: app.rankings[0].isPrimary,
                        isWaitlisted: app.rankings[0].isWaitlisted,
                        isPublished: app.rankings[0].isPublished,
                        publishedAt: app.rankings[0].publishedAt,
                        quota: app.rankings[0].quota
                    } : undefined
                }));
                this.applications.set(results);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Başvurular yüklenirken bir hata oluştu.'
                });
                this.loading.set(false);
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'APPROVED': return 'approved';
            case 'WAITLISTED': return 'waitlisted';
            case 'REJECTED': return 'rejected';
            default: return 'pending';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'APPROVED': return 'pi pi-check-circle';
            case 'WAITLISTED': return 'pi pi-clock';
            case 'REJECTED': return 'pi pi-times-circle';
            default: return 'pi pi-hourglass';
        }
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'APPROVED': return 'KABUL EDİLDİ';
            case 'WAITLISTED': return 'YEDEK LİSTE';
            case 'REJECTED': return 'REDDEDİLDİ';
            case 'RANKED': return 'SIRALANDI';
            case 'YGK_EVALUATION': return 'DEĞERLENDİRİLİYOR';
            case 'DEPARTMENT_ROUTING': return 'BÖLÜME YÖNLENDİRİLDİ';
            case 'FACULTY_ROUTING': return 'FAKÜLTEYE YÖNLENDİRİLDİ';
            case 'OIDB_REVIEW': return 'ÖİDB İNCELEMESİNDE';
            default: return 'İŞLEMDE';
        }
    }

    getPendingStatusMessage(status: string): string {
        switch (status) {
            case 'RANKED': return 'Sıralama yapıldı, sonuçların yayınlanması bekleniyor.';
            case 'YGK_EVALUATION': return 'Başvurunuz YGK tarafından değerlendiriliyor.';
            case 'DEPARTMENT_ROUTING': return 'Başvurunuz ilgili bölüme yönlendirildi.';
            case 'FACULTY_ROUTING': return 'Başvurunuz ilgili fakülteye yönlendirildi.';
            case 'OIDB_REVIEW': return 'Başvurunuz ÖİDB tarafından inceleniyor.';
            case 'SUBMITTED': return 'Başvurunuz alındı, inceleme bekleniyor.';
            default: return 'Başvurunuz işleme alınmıştır.';
        }
    }
}
