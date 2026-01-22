import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EvaluationService, DepartmentRankingSummary } from '../../../../core/services';
import { Ranking } from '../../../../core/models';

@Component({
    selector: 'app-announcements',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        TableModule,
        TagModule,
        ToastModule,
        DialogModule,
        ConfirmDialogModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="announcements-container">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <h1><i class="pi pi-megaphone"></i> Sonuç Duyurusu</h1>
                    <p>YGK tarafından oluşturulan sıralamaları görüntüleyin ve duyuru olarak yayınlayın.</p>
                </div>
                <p-button
                    icon="pi pi-refresh"
                    label="Yenile"
                    [outlined]="true"
                    (onClick)="loadRankings()"
                    [loading]="loading()"
                ></p-button>
            </div>

            <!-- Loading State -->
            <div class="loading-container" *ngIf="loading()">
                <p-progressSpinner></p-progressSpinner>
                <p>Sıralamalar yükleniyor...</p>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="!loading() && departmentSummaries().length === 0">
                <i class="pi pi-inbox"></i>
                <h3>Henüz Sıralama Yok</h3>
                <p>YGK tarafından oluşturulmuş sıralama bulunmuyor. YGK değerlendirme sonrası sıralama oluşturduğunda burada görüntülenecektir.</p>
            </div>

            <!-- Department Cards -->
            <div class="department-grid" *ngIf="!loading() && departmentSummaries().length > 0">
                <div class="department-card" *ngFor="let dept of departmentSummaries()"
                     [class.published]="dept.isPublished">
                    <div class="card-header">
                        <div class="dept-info">
                            <h3>{{ dept.department }}</h3>
                            <span class="faculty-name">{{ dept.faculty }}</span>
                        </div>
                        <p-tag
                            [value]="dept.isPublished ? 'Yayınlandı' : 'Bekliyor'"
                            [severity]="dept.isPublished ? 'success' : 'warn'"
                            [icon]="dept.isPublished ? 'pi pi-check-circle' : 'pi pi-clock'"
                        ></p-tag>
                    </div>

                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-value primary">{{ dept.primaryCount }}</span>
                            <span class="stat-label">Asil</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value waitlist">{{ dept.waitlistCount }}</span>
                            <span class="stat-label">Yedek</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value total">{{ dept.rankings.length }}</span>
                            <span class="stat-label">Toplam</span>
                        </div>
                    </div>

                    <div class="card-period">
                        <i class="pi pi-calendar"></i>
                        {{ dept.applicationPeriod }}
                    </div>

                    <div class="card-actions">
                        <p-button
                            icon="pi pi-eye"
                            label="Görüntüle"
                            [outlined]="true"
                            size="small"
                            (onClick)="viewRankings(dept)"
                        ></p-button>
                        <p-button
                            *ngIf="!dept.isPublished"
                            icon="pi pi-megaphone"
                            label="Yayınla"
                            severity="success"
                            size="small"
                            (onClick)="confirmPublish(dept)"
                            [loading]="publishingDept() === dept.department"
                        ></p-button>
                        <span class="published-date" *ngIf="dept.isPublished && dept.publishedAt">
                            <i class="pi pi-check"></i>
                            {{ dept.publishedAt | date:'dd.MM.yyyy HH:mm' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rankings Detail Dialog -->
        <p-dialog
            [(visible)]="rankingsDialogVisible"
            [header]="selectedDept()?.department + ' - Sıralama Listesi'"
            [modal]="true"
            [style]="{ width: '900px', maxHeight: '80vh' }"
            [dismissableMask]="true"
        >
            <div class="dialog-content" *ngIf="selectedDept()">
                <div class="dialog-summary">
                    <div class="summary-item">
                        <span class="label">Dönem:</span>
                        <span class="value">{{ selectedDept()?.applicationPeriod }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Durum:</span>
                        <p-tag
                            [value]="selectedDept()?.isPublished ? 'Yayınlandı' : 'Bekliyor'"
                            [severity]="selectedDept()?.isPublished ? 'success' : 'warn'"
                        ></p-tag>
                    </div>
                </div>

                <p-table [value]="selectedDept()?.rankings || []" [paginator]="true" [rows]="10"
                         styleClass="p-datatable-sm p-datatable-striped">
                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 60px">Sıra</th>
                            <th>Başvuru No</th>
                            <th>Öğrenci</th>
                            <th style="width: 80px">GPA</th>
                            <th style="width: 100px">ÖSYM</th>
                            <th style="width: 100px">Puan</th>
                            <th style="width: 80px">Durum</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-ranking>
                        <tr [class.primary-row]="ranking.isPrimary" [class.waitlist-row]="!ranking.isPrimary">
                            <td class="rank-cell">
                                <span class="rank-badge" [class.primary]="ranking.isPrimary">
                                    {{ ranking.rank }}
                                </span>
                            </td>
                            <td>{{ ranking.application?.applicationNumber }}</td>
                            <td>
                                <div class="student-info">
                                    <span class="student-name">{{ ranking.application?.student?.user?.firstName }} {{ ranking.application?.student?.user?.lastName }}</span>
                                    <span class="university-name">{{ ranking.application?.student?.currentUniversity }}</span>
                                </div>
                            </td>
                            <td>{{ ranking.application?.declaredGpa | number:'1.2-2' }}</td>
                            <td>{{ ranking.application?.declaredOsymScore | number:'1.2-2' }}</td>
                            <td class="score-cell">{{ ranking.score | number:'1.2-2' }}</td>
                            <td>
                                <p-tag
                                    [value]="ranking.isPrimary ? 'Asil' : 'Yedek'"
                                    [severity]="ranking.isPrimary ? 'success' : 'warn'"
                                    size="small"
                                ></p-tag>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">Sıralama bulunamadı.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <p-button
                        label="Kapat"
                        icon="pi pi-times"
                        [outlined]="true"
                        (onClick)="rankingsDialogVisible = false"
                    ></p-button>
                    <p-button
                        *ngIf="!selectedDept()?.isPublished"
                        label="Sonuçları Yayınla"
                        icon="pi pi-megaphone"
                        severity="success"
                        (onClick)="confirmPublish(selectedDept()!)"
                    ></p-button>
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .announcements-container {
            padding: 1.5rem;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .header-content h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.75rem;
            color: var(--text-color);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .header-content h1 i {
            color: var(--primary-color);
        }

        .header-content p {
            margin: 0;
            color: var(--text-color-secondary);
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem;
            color: var(--text-color-secondary);
        }

        .loading-container p {
            margin-top: 1rem;
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
            color: var(--text-color);
        }

        .empty-state p {
            color: var(--text-color-secondary);
            max-width: 400px;
            margin: 0 auto;
        }

        .department-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        .department-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid var(--surface-border);
            transition: all 0.2s;
        }

        .department-card:hover {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }

        .department-card.published {
            border-color: var(--green-200);
            background: linear-gradient(135deg, var(--surface-card) 0%, rgba(34, 197, 94, 0.05) 100%);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .dept-info h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
            color: var(--text-color);
        }

        .faculty-name {
            font-size: 0.85rem;
            color: var(--text-color-secondary);
        }

        .card-stats {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: var(--surface-ground);
            border-radius: 8px;
        }

        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 600;
        }

        .stat-value.primary { color: var(--green-500); }
        .stat-value.waitlist { color: var(--orange-500); }
        .stat-value.total { color: var(--primary-color); }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
        }

        .card-period {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-color-secondary);
            margin-bottom: 1rem;
        }

        .card-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .published-date {
            font-size: 0.8rem;
            color: var(--green-600);
            display: flex;
            align-items: center;
            gap: 0.25rem;
            margin-left: auto;
        }

        /* Dialog Styles */
        .dialog-content {
            min-height: 300px;
        }

        .dialog-summary {
            display: flex;
            gap: 2rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--surface-ground);
            border-radius: 8px;
        }

        .summary-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .summary-item .label {
            font-weight: 500;
            color: var(--text-color-secondary);
        }

        .summary-item .value {
            color: var(--text-color);
        }

        .rank-cell {
            text-align: center;
        }

        .rank-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-weight: 600;
            font-size: 0.9rem;
            background: var(--orange-100);
            color: var(--orange-700);
        }

        .rank-badge.primary {
            background: var(--green-100);
            color: var(--green-700);
        }

        .student-info {
            display: flex;
            flex-direction: column;
        }

        .student-name {
            font-weight: 500;
        }

        .university-name {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
        }

        .score-cell {
            font-weight: 600;
            color: var(--primary-color);
        }

        .primary-row {
            background: rgba(34, 197, 94, 0.05);
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }
    `]
})
export class AnnouncementsComponent implements OnInit {
    departmentSummaries = signal<DepartmentRankingSummary[]>([]);
    loading = signal(false);
    publishingDept = signal<string | null>(null);
    rankingsDialogVisible = false;
    selectedDept = signal<DepartmentRankingSummary | null>(null);

    constructor(
        private evaluationService: EvaluationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadRankings();
    }

    loadRankings() {
        this.loading.set(true);
        this.evaluationService.getRankingsForAnnouncement().subscribe({
            next: (summaries) => {
                this.departmentSummaries.set(summaries);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Sıralamalar yüklenirken bir hata oluştu.'
                });
                this.loading.set(false);
            }
        });
    }

    viewRankings(dept: DepartmentRankingSummary) {
        this.selectedDept.set(dept);
        this.rankingsDialogVisible = true;
    }

    confirmPublish(dept: DepartmentRankingSummary) {
        this.confirmationService.confirm({
            message: `${dept.department} bölümü için ${dept.applicationPeriod} dönemi sonuçlarını yayınlamak istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm adaylara bildirim gönderilecektir.`,
            header: 'Sonuçları Yayınla',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Evet, Yayınla',
            rejectLabel: 'İptal',
            accept: () => this.publishResults(dept)
        });
    }

    publishResults(dept: DepartmentRankingSummary) {
        this.publishingDept.set(dept.department);
        this.evaluationService.publishRankings(dept.department, dept.applicationPeriod).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: `${dept.department} sonuçları başarıyla yayınlandı.`
                });
                this.publishingDept.set(null);
                this.rankingsDialogVisible = false;
                this.loadRankings(); // Refresh the list
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Sonuçlar yayınlanırken bir hata oluştu.'
                });
                this.publishingDept.set(null);
            }
        });
    }
}
