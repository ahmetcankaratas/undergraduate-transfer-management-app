import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApplicationService, DocumentService } from '../../../../core/services';
import { Application, Document, ApplicationStatus, DocumentType } from '../../../../core/models';

@Component({
    selector: 'app-application-review',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, ToastModule, TextareaModule, DialogModule, MessageModule, CheckboxModule, TooltipModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
        <div class="review-container">
            <!-- Back Button -->
            <div class="back-section">
                <a routerLink="/oidb/review" class="back-link">
                    <i class="pi pi-arrow-left"></i>
                    Başvuru Listesine Dön
                </a>
            </div>

            <!-- Application Header -->
            <div class="app-header">
                <div class="app-header-info">
                    <h2>{{ application()?.applicationNumber }}</h2>
                    <span class="status-badge" [class]="getStatusClass(application()?.status)">
                        {{ getStatusLabel(application()?.status) }}
                    </span>
                </div>
                <div class="app-header-date">
                    Başvuru Tarihi: {{ application()?.submittedAt | date:'dd.MM.yyyy HH:mm' }}
                </div>
            </div>

            <!-- Student Info Card -->
            <div class="info-card">
                <h3 class="card-title">Öğrenci Bilgileri</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Ad Soyad</span>
                        <span class="info-value">{{ getStudentName() }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">E-posta</span>
                        <span class="info-value">{{ application()?.student?.user?.email || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Mevcut Üniversite</span>
                        <span class="info-value">{{ application()?.student?.currentUniversity || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Mevcut Bölüm</span>
                        <span class="info-value">{{ application()?.student?.currentDepartment || '-' }}</span>
                    </div>
                </div>
            </div>

            <!-- Target Program Card -->
            <div class="info-card">
                <h3 class="card-title">Hedef Program</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Fakülte</span>
                        <span class="info-value">{{ application()?.targetFaculty || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Bölüm</span>
                        <span class="info-value">{{ application()?.targetDepartment || '-' }}</span>
                    </div>
                </div>
            </div>

            <!-- Academic Info Card -->
            <div class="info-card">
                <h3 class="card-title">Akademik Bilgiler ve Kontrol</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Beyan Edilen GPA</span>
                        <div class="flex align-items-center gap-2">
                            <span class="info-value highlight">{{ application()?.declaredGpa | number:'1.2-2' }}</span>
                            <i class="pi" [class]="getValidationIcon(isGpaValid())" 
                               [class.text-green-500]="isGpaValid()" 
                               [class.text-red-500]="!isGpaValid()"
                               [pTooltip]="isGpaValid() ? 'GPA Uygun (Min 2.50)' : 'GPA Yetersiz'" tooltipPosition="top"></i>
                        </div>
                        <small *ngIf="!isGpaValid()" class="text-red-500">GPA 2.50'nin altında!</small>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ÖSYM Puanı</span>
                        <div class="flex align-items-center gap-2">
                            <span class="info-value highlight">{{ application()?.declaredOsymScore | number:'1.3-3' }}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Başarı Sıralaması</span>
                        <div class="flex align-items-center gap-2">
                            <span class="info-value highlight">{{ application()?.declaredOsymRank | number }}</span>
                            <i class="pi" [class]="getValidationIcon(isRankValid())" 
                               [class.text-green-500]="isRankValid()" 
                               [class.text-red-500]="!isRankValid()"
                               [pTooltip]="isRankValid() ? 'Sıralama Uygun' : 'Sıralama Yetersiz'" tooltipPosition="top"></i>
                        </div>
                        <small *ngIf="!isRankValid()" class="text-red-500">Sıralama barajın üzerinde (Yetersiz)!</small>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ÖSYM Yılı</span>
                        <span class="info-value">{{ application()?.declaredOsymYear || '-' }}</span>
                    </div>
                </div>
            </div>

            <!-- Documents Card -->
            <div class="info-card">
                <h3 class="card-title">Yüklenen Belgeler</h3>
                <div class="documents-list" *ngIf="documents().length > 0">
                    <div class="document-item" *ngFor="let doc of documents()">
                        <div class="doc-info">
                            <i class="pi pi-file-pdf doc-icon"></i>
                            <div class="doc-details">
                                <span class="doc-name">{{ doc.originalName }}</span>
                                <span class="doc-type">{{ getDocumentTypeLabel(doc.type) }}</span>
                            </div>
                        </div>
                        <div class="doc-status-actions">
                            <span class="doc-status" [class.verified]="doc.isVerified">
                                {{ doc.isVerified ? 'Doğrulandı' : 'Beklemede' }}
                            </span>
                            <button class="doc-action-btn" (click)="previewDocument(doc)" pTooltip="Belgeyi Önizle" tooltipPosition="top">
                                <i class="pi pi-eye"></i>
                            </button>
                            <button class="doc-action-btn" (click)="downloadDocument(doc)" pTooltip="Belgeyi İndir" tooltipPosition="top">
                                <i class="pi pi-download"></i>
                            </button>
                            <button
                                *ngIf="doc.isVerified && canReview()"
                                class="doc-action-btn reject"
                                (click)="unverifyDocument(doc)"
                                pTooltip="Doğrulamayı Geri Al" tooltipPosition="top"
                            >
                                <i class="pi pi-times"></i>
                            </button>
                            <button
                                *ngIf="!doc.isVerified && canReview()"
                                class="doc-action-btn verify"
                                (click)="verifyDocument(doc)"
                                pTooltip="Belgeyi Doğrula" tooltipPosition="top"
                            >
                                <i class="pi pi-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="no-documents" *ngIf="documents().length === 0">
                    <i class="pi pi-exclamation-triangle text-red-500"></i>
                    <p class="text-red-500 font-bold">Hiç belge yüklenmemiş! Başvuru geçersiz.</p>
                </div>
            </div>

            <!-- Notes Card -->
            <div class="info-card" *ngIf="application()?.notes">
                <h3 class="card-title">Öğrenci Notları</h3>
                <p class="notes-text">{{ application()?.notes }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="action-section" *ngIf="canReview()">
                <h3 class="card-title">İnceleme ve Onay</h3>
                
                <p-message *ngIf="!isSystemValid()" severity="warn" text="Sistem uyarıları var! Lütfen dikkatli inceleyin." styleClass="mb-3 block"></p-message>

                <div class="checklist mb-4 p-3 surface-100 border-round">
                    <div class="field-checkbox mb-2">
                        <p-checkbox [(ngModel)]="checklist.gpa" [binary]="true" inputId="checkGpa"></p-checkbox>
                        <label for="checkGpa" class="ml-2">GPA (Min 2.50) kontrol edildi.</label>
                    </div>
                    <div class="field-checkbox mb-2">
                        <p-checkbox [(ngModel)]="checklist.rank" [binary]="true" inputId="checkRank"></p-checkbox>
                        <label for="checkRank" class="ml-2">Başarı Sıralaması (Müh:300k, Mim:250k) kontrol edildi.</label>
                    </div>
                    <div class="field-checkbox">
                        <p-checkbox [(ngModel)]="checklist.docs" [binary]="true" inputId="checkDocs"></p-checkbox>
                        <label for="checkDocs" class="ml-2">Tüm belgeler tam ve eksiksiz.</label>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="action-btn reject" (click)="showRejectDialog = true" [disabled]="processing">
                        <i class="pi pi-times"></i>
                        Reddet
                    </button>
                    <button class="action-btn approve" (click)="confirmApprove()" [disabled]="processing || !isChecklistComplete()">
                        <i class="pi pi-check"></i>
                        {{ processing ? 'İşleniyor...' : 'Onayla ve Fakülteye Yönlendir' }}
                    </button>
                </div>
            </div>

            <!-- Already Reviewed Message -->
            <div class="reviewed-message" *ngIf="!canReview() && application()?.status !== 'SUBMITTED'">
                <i class="pi pi-info-circle"></i>
                <span>Bu başvuru zaten incelenmiş.</span>
            </div>
        </div>

        <!-- Preview Dialog -->
        <p-dialog header="Belge Önizleme" [(visible)]="showPreviewDialog" [modal]="true" [style]="{width: '90vw', height: '95vh', 'max-height': '95vh'}" [maximizable]="true" [resizable]="false" [draggable]="false" contentStyleClass="p-0">
            <div class="preview-content" *ngIf="previewUrl">
                <iframe *ngIf="isPreviewPdf" [src]="previewUrl" class="preview-frame" frameborder="0"></iframe>
                <img *ngIf="!isPreviewPdf" [src]="previewUrl" class="preview-image" />
            </div>
        </p-dialog>

        <!-- Reject Dialog -->
        <p-dialog header="Başvuruyu Reddet" [(visible)]="showRejectDialog" [modal]="true" [style]="{width: '450px'}">
            <div class="reject-dialog-content">
                <p>Bu başvuruyu reddetmek istediğinizden emin misiniz?</p>
                <div class="reject-reason">
                    <label>Red Gerekçesi *</label>
                    <textarea pTextarea [(ngModel)]="rejectReason" rows="4" placeholder="Red gerekçesini yazın..."></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <button class="dialog-btn cancel" (click)="showRejectDialog = false">İptal</button>
                <button class="dialog-btn reject" (click)="rejectApplication()" [disabled]="!rejectReason || processing">
                    {{ processing ? 'İşleniyor...' : 'Reddet' }}
                </button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .review-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 1.5rem;
        }

        .back-section {
            margin-bottom: 1.5rem;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #8B1538;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #6d1029;
        }

        /* App Header */
        .app-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .app-header-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .app-header-info h2 {
            margin: 0;
            color: #333;
            font-size: 1.5rem;
        }

        .app-header-date {
            color: #666;
            font-size: 0.9rem;
        }

        .status-badge {
            display: inline-block;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .status-badge.draft { background: #e0e0e0; color: #666; }
        .status-badge.submitted { background: #e3f2fd; color: #1976d2; }
        .status-badge.review { background: #fff3e0; color: #f57c00; }
        .status-badge.approved { background: #e8f5e9; color: #388e3c; }
        .status-badge.rejected { background: #ffebee; color: #d32f2f; }

        /* Info Card */
        .info-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            padding: 1.5rem;
            margin-bottom: 1rem;
        }

        .card-title {
            margin: 0 0 1rem 0;
            color: #333;
            font-size: 1rem;
            font-weight: 600;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #eee;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .info-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 1rem;
            color: #333;
            font-weight: 500;
        }

        .info-value.highlight {
            color: #8B1538;
            font-size: 1.1rem;
        }

        /* Documents List */
        .documents-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .document-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .doc-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .doc-icon {
            font-size: 1.5rem;
            color: #8B1538;
        }

        .doc-details {
            display: flex;
            flex-direction: column;
        }

        .doc-name {
            font-weight: 500;
            color: #333;
        }

        .doc-type {
            font-size: 0.8rem;
            color: #666;
        }

        .doc-status-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .doc-status {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            background: #fff3e0;
            color: #f57c00;
        }

        .doc-status.verified {
            background: #e8f5e9;
            color: #388e3c;
        }

        .doc-action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e3f2fd;
            color: #1976d2;
            transition: background 0.2s;
        }

        .doc-action-btn:hover {
            background: #bbdefb;
        }

        .doc-action-btn.verify {
            background: #e8f5e9;
            color: #388e3c;
        }

        .doc-action-btn.verify:hover {
            background: #c8e6c9;
        }

        .doc-action-btn.reject {
            background: #ffebee;
            color: #d32f2f;
        }

        .doc-action-btn.reject:hover {
            background: #ffcdd2;
        }

        .no-documents {
            text-align: center;
            padding: 2rem;
            color: #666;
        }

        .no-documents i {
            font-size: 2rem;
            color: #ccc;
            margin-bottom: 0.5rem;
        }

        .notes-text {
            color: #555;
            line-height: 1.6;
            margin: 0;
            white-space: pre-wrap;
        }

        /* Action Section */
        .action-section {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            padding: 1.5rem;
            margin-top: 1.5rem;
        }

        .review-notes {
            margin-bottom: 1.5rem;
        }

        .review-notes label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }

        .review-notes textarea {
            width: 100%;
            border-radius: 8px;
        }

        .action-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }

        .action-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 24px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .action-btn.approve {
            background: #388e3c;
            color: #ffffff;
        }

        .action-btn.approve:hover:not(:disabled) {
            background: #2e7d32;
        }

        .action-btn.reject {
            background: #ffebee;
            color: #d32f2f;
        }

        .action-btn.reject:hover:not(:disabled) {
            background: #ffcdd2;
        }

        .reviewed-message {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            background: #e3f2fd;
            border-radius: 12px;
            color: #1976d2;
            margin-top: 1.5rem;
        }

        /* Dialog */
        .reject-dialog-content {
            padding: 1rem 0;
        }

        .reject-reason {
            margin-top: 1rem;
        }

        .reject-reason label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .reject-reason textarea {
            width: 100%;
            border-radius: 8px;
        }

        .dialog-btn {
            padding: 0.6rem 1.25rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            margin-left: 0.5rem;
        }

        .dialog-btn.cancel {
            background: #e0e0e0;
            color: #666;
        }

        .dialog-btn.reject {
            background: #d32f2f;
            color: #ffffff;
        }

        .dialog-btn.reject:disabled {
            background: #ef9a9a;
        }

        .preview-content {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #333;
            overflow: hidden;
        }

        .preview-frame {
            width: 100%;
            height: 100%;
            display: block;
        }

        .preview-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        /* Dialog content override to remove padding */
        :host ::ng-deep .p-dialog-content {
            padding: 0 !important;
            height: 100%;
        }

        @media (max-width: 768px) {
            .app-header {
                flex-direction: column;
            }

            .action-buttons {
                flex-direction: column;
            }

            .action-btn {
                width: 100%;
                justify-content: center;
            }
        }
    `]
})
export class ApplicationReviewComponent implements OnInit {
    application = signal<Application | null>(null);
    documents = signal<Document[]>([]);
    rejectReason = '';
    showRejectDialog = false;
    showPreviewDialog = false;
    previewUrl: SafeResourceUrl | null = null;
    isPreviewPdf = false;
    processing = false;
    
    // Manual Verification Checklist
    checklist = {
        gpa: false,
        rank: false,
        docs: false
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private applicationService: ApplicationService,
        private documentService: DocumentService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        this.loadApplication(id);
    }

    private loadApplication(id: string) {
        this.applicationService.getById(id).subscribe({
            next: (app) => {
                this.application.set(app);
                this.documents.set(app.documents || []);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Başvuru yüklenemedi.'
                });
                this.router.navigate(['/oidb/review']);
            }
        });
    }

    getStudentName(): string {
        const user = this.application()?.student?.user;
        if (user) {
            return `${user.firstName} ${user.lastName}`;
        }
        return '-';
    }

    canReview(): boolean {
        return this.application()?.status === ApplicationStatus.SUBMITTED;
    }

    confirmApprove() {
        this.confirmationService.confirm({
            message: 'Başvuruyu onaylayıp Fakülteye yönlendirmek istediğinizden emin misiniz?',
            header: 'Onay',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Evet, Onayla',
            rejectLabel: 'Vazgeç',
            acceptButtonStyleClass: 'p-button-success',
            accept: () => {
                this.approveApplication();
            }
        });
    }

    approveApplication() {
        if (!this.application()) return;

        this.processing = true;
        this.applicationService.review(this.application()!.id, true).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: 'Başvuru onaylandı ve fakülteye yönlendirildi.'
                });
                setTimeout(() => this.router.navigate(['/oidb/review']), 1500);
            },
            error: () => {
                this.processing = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Başvuru onaylanamadı.'
                });
            }
        });
    }

    rejectApplication() {
        if (!this.application() || !this.rejectReason) return;

        this.processing = true;
        this.applicationService.review(this.application()!.id, false, this.rejectReason).subscribe({
            next: () => {
                this.showRejectDialog = false;
                this.messageService.add({
                    severity: 'info',
                    summary: 'Başarılı',
                    detail: 'Başvuru reddedildi.'
                });
                setTimeout(() => this.router.navigate(['/oidb/review']), 1500);
            },
            error: () => {
                this.processing = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Başvuru reddedilemedi.'
                });
            }
        });
    }

    previewDocument(doc: Document) {
        this.documentService.download(doc.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                this.isPreviewPdf = doc.mimeType === 'application/pdf' || doc.fileName.toLowerCase().endsWith('.pdf');
                this.showPreviewDialog = true;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Belge önizlemesi yüklenemedi.' });
            }
        });
    }

    downloadDocument(doc: Document) {
        this.documentService.download(doc.id).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.originalName;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    verifyDocument(doc: Document) {
        this.documentService.verify(doc.id).subscribe({
            next: () => {
                this.documents.update(docs =>
                    docs.map(d => d.id === doc.id ? { ...d, isVerified: true } : d)
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: 'Belge doğrulandı.'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Belge doğrulanamadı.'
                });
            }
        });
    }

    unverifyDocument(doc: Document) {
        this.documentService.unverify(doc.id).subscribe({
            next: () => {
                this.documents.update(docs =>
                    docs.map(d => d.id === doc.id ? { ...d, isVerified: false } : d)
                );
                this.messageService.add({
                    severity: 'info',
                    summary: 'Geri Alındı',
                    detail: 'Belge doğrulaması kaldırıldı.'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'İşlem başarısız.'
                });
            }
        });
    }

    getDocumentTypeLabel(type: DocumentType): string {
        const labels: Record<DocumentType, string> = {
            TRANSCRIPT: 'Transkript',
            OSYM_RESULT: 'ÖSYM Puan Belgesi',
            ENGLISH_PROFICIENCY: 'Yabancı Dil Belgesi',
            IDENTITY: 'Kimlik Belgesi',
            STUDENT_CERTIFICATE: 'Öğrenci Belgesi',
            COURSE_CONTENTS: 'Ders İçerikleri (Katalog)',
            OSYM_PLACEMENT: 'ÖSYM Yerleştirme Sonuç Belgesi',
            INTIBAK: 'İntibak Belgesi',
            OTHER: 'Diğer Belge'
        };
        return labels[type] || type;
    }

    getStatusLabel(status?: ApplicationStatus): string {
        if (!status) return '';
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

    getStatusClass(status?: ApplicationStatus): string {
        if (!status) return '';
        const classes: Record<ApplicationStatus, string> = {
            [ApplicationStatus.DRAFT]: 'draft',
            [ApplicationStatus.SUBMITTED]: 'submitted',
            [ApplicationStatus.OIDB_REVIEW]: 'review',
            [ApplicationStatus.FACULTY_ROUTING]: 'review',
            [ApplicationStatus.DEPARTMENT_ROUTING]: 'review',
            [ApplicationStatus.YGK_EVALUATION]: 'review',
            [ApplicationStatus.RANKED]: 'review',
            [ApplicationStatus.FACULTY_BOARD]: 'review',
            [ApplicationStatus.APPROVED]: 'approved',
            [ApplicationStatus.REJECTED]: 'rejected',
            [ApplicationStatus.WAITLISTED]: 'review'
        };
        return classes[status] || '';
    }

    // Validation Helpers
    isGpaValid(): boolean {
        const gpa = this.application()?.declaredGpa;
        return gpa !== undefined && gpa >= 2.50;
    }

    isRankValid(): boolean {
        const rank = this.application()?.declaredOsymRank;
        const targetDept = this.application()?.targetDepartment || '';
        
        // Mühendislik için 300.000, Mimarlık için 250.000 (Düşük olan daha iyi)
        const threshold = targetDept.includes('Mimarlık') ? 250000 : 300000;
        
        return rank !== undefined && rank <= threshold;
    }

    getValidationIcon(isValid: boolean): string {
        return isValid ? 'pi pi-check-circle' : 'pi pi-times-circle';
    }

    // Sistem otomatik kontrolleri (Sadece uyarı amaçlı)
    isSystemValid(): boolean {
        return this.isGpaValid() && this.isRankValid() && this.documents().length > 0;
    }

    // Personel onayı (Butonu açmak için)
    isChecklistComplete(): boolean {
        return this.checklist.gpa && this.checklist.rank && this.checklist.docs;
    }
}