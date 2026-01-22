import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ApplicationService, FacultyService, DocumentService } from '../../../../core/services';
import { Application, ApplicationStatus, Document } from '../../../../core/models';

@Component({
    selector: 'app-routing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        TagModule,
        ToastModule,
        DialogModule,
        SelectModule,
        TextareaModule,
        DividerModule,
        TooltipModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
        <div class="grid">
            <div class="col-12">
                <p-card header="Başvuruları Bölüme Yönlendir">
                    <p-table [value]="applications()" [paginator]="true" [rows]="10" [rowHover]="true" styleClass="p-datatable-striped">
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 140px">Başvuru No</th>
                                <th>Öğrenci</th>
                                <th>Hedef Bölüm</th>
                                <th style="width: 80px">GPA</th>
                                <th style="width: 100px">ÖSYM</th>
                                <th style="width: 110px">Geliş Tarihi</th>
                                <th style="width: 140px">İşlemler</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-app>
                            <tr>
                                <td><span class="font-semibold text-primary">{{ app.applicationNumber }}</span></td>
                                <td>{{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}</td>
                                <td>{{ app.targetDepartment }}</td>
                                <td>
                                    <span [class]="app.declaredGpa >= 2.5 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                                        {{ app.declaredGpa | number:'1.2-2' }}
                                    </span>
                                </td>
                                <td>{{ app.declaredOsymScore | number:'1.3-3' }}</td>
                                <td>{{ app.routedToFacultyAt | date:'dd.MM.yyyy' }}</td>
                                <td>
                                    <div class="flex gap-1">
                                        <p-button
                                            icon="pi pi-eye"
                                            [rounded]="true"
                                            [text]="true"
                                            severity="info"
                                            pTooltip="Detaylı İncele"
                                            tooltipPosition="top"
                                            (onClick)="showReviewDialog(app)"
                                        ></p-button>
                                        <p-button
                                            icon="pi pi-send"
                                            [rounded]="true"
                                            [text]="true"
                                            severity="success"
                                            pTooltip="Bölüme Gönder"
                                            tooltipPosition="top"
                                            (onClick)="confirmRouteToDepartment(app)"
                                        ></p-button>
                                        <p-button
                                            icon="pi pi-times"
                                            [rounded]="true"
                                            [text]="true"
                                            severity="danger"
                                            pTooltip="Reddet"
                                            tooltipPosition="top"
                                            (onClick)="showRejectDialog(app)"
                                        ></p-button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <i class="pi pi-inbox text-4xl text-300 mb-3 block"></i>
                                    <p class="text-500 m-0">Yönlendirilecek başvuru bulunmuyor.</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>

        <!-- Detaylı İnceleme Dialog -->
        <p-dialog
            header="Başvuru İnceleme"
            [(visible)]="reviewDialogVisible"
            [modal]="true"
            [style]="{width: '900px', maxWidth: '95vw'}"
            [maximizable]="true"
            [draggable]="false"
            styleClass="review-dialog"
        >
            <div class="review-container" *ngIf="selectedApplication">
                <!-- Header -->
                <div class="review-header">
                    <div class="flex align-items-center gap-3">
                        <span class="app-number">{{ selectedApplication.applicationNumber }}</span>
                        <p-tag [value]="'Fakülte İncelemesinde'" severity="warn"></p-tag>
                    </div>
                    <span class="text-500 text-sm">
                        Başvuru: {{ selectedApplication.submittedAt | date:'dd.MM.yyyy HH:mm' }}
                    </span>
                </div>

                <div class="review-content">
                    <!-- Öğrenci Bilgileri -->
                    <div class="info-card">
                        <div class="card-header">
                            <i class="pi pi-user"></i>
                            <h4>Öğrenci Bilgileri</h4>
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">Ad Soyad</span>
                                <span class="value">{{ selectedApplication.student?.user?.firstName }} {{ selectedApplication.student?.user?.lastName }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">E-posta</span>
                                <span class="value">{{ selectedApplication.student?.user?.email || '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Mevcut Üniversite</span>
                                <span class="value">{{ selectedApplication.student?.currentUniversity || '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Mevcut Bölüm</span>
                                <span class="value">{{ selectedApplication.student?.currentDepartment || '-' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Hedef Program -->
                    <div class="info-card">
                        <div class="card-header">
                            <i class="pi pi-building"></i>
                            <h4>Hedef Program</h4>
                        </div>
                        <div class="info-grid cols-2">
                            <div class="info-item">
                                <span class="label">Fakülte</span>
                                <span class="value">{{ selectedApplication.targetFaculty }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Bölüm</span>
                                <span class="value">{{ selectedApplication.targetDepartment }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Akademik Bilgiler -->
                    <div class="info-card highlight">
                        <div class="card-header">
                            <i class="pi pi-chart-bar"></i>
                            <h4>Akademik Bilgiler</h4>
                        </div>
                        <div class="academic-grid">
                            <div class="academic-item" [class.valid]="(selectedApplication.declaredGpa || 0) >= 2.5" [class.invalid]="(selectedApplication.declaredGpa || 0) < 2.5">
                                <span class="academic-value">{{ selectedApplication.declaredGpa | number:'1.2-2' }}</span>
                                <span class="academic-label">GPA</span>
                                <i class="pi validation-icon" [class.pi-check-circle]="(selectedApplication.declaredGpa || 0) >= 2.5" [class.pi-times-circle]="(selectedApplication.declaredGpa || 0) < 2.5"></i>
                            </div>
                            <div class="academic-item">
                                <span class="academic-value">{{ selectedApplication.declaredOsymScore | number:'1.3-3' }}</span>
                                <span class="academic-label">ÖSYM Puanı</span>
                            </div>
                            <div class="academic-item">
                                <span class="academic-value">{{ selectedApplication.declaredOsymRank | number:'1.0-0' }}</span>
                                <span class="academic-label">Sıralama</span>
                            </div>
                            <div class="academic-item">
                                <span class="academic-value">{{ selectedApplication.declaredOsymYear || '-' }}</span>
                                <span class="academic-label">ÖSYM Yılı</span>
                            </div>
                        </div>
                    </div>

                    <!-- Belgeler -->
                    <div class="info-card">
                        <div class="card-header">
                            <i class="pi pi-folder-open"></i>
                            <h4>Yüklenen Belgeler</h4>
                            <span class="doc-count">{{ selectedApplication.documents?.length || 0 }} belge</span>
                        </div>
                        <div class="documents-list" *ngIf="selectedApplication.documents?.length; else noDocuments">
                            <div class="document-item" *ngFor="let doc of selectedApplication.documents">
                                <div class="doc-info">
                                    <i class="pi pi-file-pdf doc-icon"></i>
                                    <div class="doc-details">
                                        <span class="doc-name">{{ doc.originalName }}</span>
                                        <span class="doc-type">{{ getDocumentTypeName(doc.type) }}</span>
                                    </div>
                                </div>
                                <div class="doc-actions">
                                    <span class="doc-status" [class.verified]="doc.isVerified">
                                        {{ doc.isVerified ? 'Doğrulandı' : 'Beklemede' }}
                                    </span>
                                    <button class="doc-btn preview" (click)="previewDocument(doc)" pTooltip="Önizle" tooltipPosition="top">
                                        <i class="pi pi-eye"></i>
                                    </button>
                                    <button class="doc-btn download" (click)="downloadDocument(doc)" pTooltip="İndir" tooltipPosition="top">
                                        <i class="pi pi-download"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <ng-template #noDocuments>
                            <div class="no-documents">
                                <i class="pi pi-exclamation-triangle"></i>
                                <p>Yüklenen belge bulunmuyor!</p>
                            </div>
                        </ng-template>
                    </div>

                    <!-- Öğrenci Notları -->
                    <div class="info-card" *ngIf="selectedApplication.notes">
                        <div class="card-header">
                            <i class="pi pi-comment"></i>
                            <h4>Öğrenci Notları</h4>
                        </div>
                        <p class="student-notes">{{ selectedApplication.notes }}</p>
                    </div>

                    <p-divider></p-divider>

                    <!-- Ön Değerlendirme Formu -->
                    <div class="evaluation-section">
                        <h4 class="section-title">
                            <i class="pi pi-check-square"></i>
                            Ön Değerlendirme
                        </h4>

                        <div class="form-grid">
                            <div class="form-field">
                                <label for="preDecision">Karar</label>
                                <p-select
                                    id="preDecision"
                                    [(ngModel)]="preReviewDecision"
                                    [options]="preReviewOptions"
                                    placeholder="Karar seçin..."
                                    [style]="{width: '100%'}"
                                ></p-select>
                            </div>

                            <div class="form-field full-width" *ngIf="preReviewDecision === 'CONDITIONAL'">
                                <label for="conditions">Koşullar</label>
                                <textarea
                                    pTextarea
                                    id="conditions"
                                    [(ngModel)]="preReviewConditions"
                                    rows="2"
                                    placeholder="Şartlı kabul koşullarını belirtin..."
                                ></textarea>
                            </div>

                            <div class="form-field full-width">
                                <label for="notes">İnceleme Notları</label>
                                <textarea
                                    pTextarea
                                    id="notes"
                                    [(ngModel)]="preReviewNotes"
                                    rows="3"
                                    placeholder="Değerlendirme notlarınızı yazın..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <p-button
                        label="Kapat"
                        icon="pi pi-times"
                        [text]="true"
                        severity="secondary"
                        (onClick)="reviewDialogVisible = false"
                    ></p-button>
                    <div class="action-buttons">
                        <p-button
                            *ngIf="preReviewDecision === 'REJECT'"
                            label="Reddet"
                            icon="pi pi-times-circle"
                            severity="danger"
                            (onClick)="rejectFromReview()"
                        ></p-button>
                        <p-button
                            *ngIf="preReviewDecision !== 'REJECT'"
                            label="Bölüme Gönder"
                            icon="pi pi-send"
                            severity="success"
                            (onClick)="approveAndRoute()"
                            [disabled]="!preReviewDecision"
                        ></p-button>
                    </div>
                </div>
            </ng-template>
        </p-dialog>

        <!-- PDF Önizleme Dialog -->
        <p-dialog
            header="Belge Önizleme"
            [(visible)]="previewDialogVisible"
            [modal]="true"
            [style]="{width: '90vw', height: '90vh'}"
            [maximizable]="true"
            [draggable]="false"
            contentStyleClass="preview-dialog-content"
        >
            <div class="preview-container" *ngIf="previewUrl">
                <iframe
                    *ngIf="isPreviewPdf"
                    [src]="previewUrl"
                    class="preview-frame"
                ></iframe>
                <img
                    *ngIf="!isPreviewPdf"
                    [src]="previewUrl"
                    class="preview-image"
                />
            </div>
            <div class="preview-loading" *ngIf="previewLoading">
                <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                <p>Belge yükleniyor...</p>
            </div>
        </p-dialog>

        <!-- Red Dialog -->
        <p-dialog
            header="Başvuruyu Reddet"
            [(visible)]="rejectDialogVisible"
            [modal]="true"
            [style]="{width: '500px'}"
        >
            <div class="reject-content" *ngIf="selectedApplication">
                <div class="reject-warning">
                    <i class="pi pi-exclamation-triangle"></i>
                    <p><strong>{{ selectedApplication.applicationNumber }}</strong> numaralı başvuruyu reddetmek üzeresiniz.</p>
                </div>
                <div class="form-field">
                    <label for="rejectReason">Red Nedeni *</label>
                    <textarea
                        pTextarea
                        id="rejectReason"
                        [(ngModel)]="rejectReason"
                        rows="4"
                        placeholder="Red nedenini detaylı olarak açıklayın..."
                    ></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button
                    label="Vazgeç"
                    icon="pi pi-times"
                    [text]="true"
                    severity="secondary"
                    (onClick)="rejectDialogVisible = false"
                ></p-button>
                <p-button
                    label="Reddet"
                    icon="pi pi-times-circle"
                    severity="danger"
                    (onClick)="confirmReject()"
                    [disabled]="!rejectReason"
                ></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        /* Review Dialog Styles */
        .review-container {
            padding: 0;
        }

        .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            margin-bottom: 1.5rem;
        }

        .app-number {
            font-size: 1.25rem;
            font-weight: 700;
            color: #8B1538;
        }

        .review-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        /* Info Cards */
        .info-card {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 1.25rem;
        }

        .info-card.highlight {
            background: linear-gradient(135deg, #fff8f0 0%, #fff 100%);
            border-color: #ffd6a5;
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #eee;
        }

        .card-header i {
            font-size: 1.1rem;
            color: #8B1538;
        }

        .card-header h4 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
            color: #333;
            flex: 1;
        }

        .doc-count {
            font-size: 0.8rem;
            color: #666;
            background: #f0f0f0;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
        }

        /* Info Grid */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        .info-grid.cols-2 {
            grid-template-columns: repeat(2, 1fr);
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .info-item .label {
            font-size: 0.75rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-item .value {
            font-size: 0.95rem;
            color: #333;
            font-weight: 500;
        }

        /* Academic Grid */
        .academic-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
        }

        .academic-item {
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 10px;
            position: relative;
        }

        .academic-item.valid {
            background: #e8f5e9;
        }

        .academic-item.invalid {
            background: #ffebee;
        }

        .academic-item .academic-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
        }

        .academic-item.valid .academic-value {
            color: #2e7d32;
        }

        .academic-item.invalid .academic-value {
            color: #c62828;
        }

        .academic-item .academic-label {
            display: block;
            font-size: 0.75rem;
            color: #666;
            margin-top: 0.25rem;
        }

        .academic-item .validation-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 1rem;
        }

        .academic-item.valid .validation-icon {
            color: #2e7d32;
        }

        .academic-item.invalid .validation-icon {
            color: #c62828;
        }

        /* Documents List */
        .documents-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .document-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            transition: background 0.2s;
        }

        .document-item:hover {
            background: #e9ecef;
        }

        .doc-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .doc-icon {
            font-size: 1.5rem;
            color: #dc3545;
        }

        .doc-details {
            display: flex;
            flex-direction: column;
        }

        .doc-name {
            font-weight: 500;
            color: #333;
            font-size: 0.9rem;
        }

        .doc-type {
            font-size: 0.75rem;
            color: #666;
        }

        .doc-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .doc-status {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            background: #fff3e0;
            color: #f57c00;
        }

        .doc-status.verified {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .doc-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .doc-btn.preview {
            background: #e3f2fd;
            color: #1976d2;
        }

        .doc-btn.preview:hover {
            background: #bbdefb;
        }

        .doc-btn.download {
            background: #e8f5e9;
            color: #388e3c;
        }

        .doc-btn.download:hover {
            background: #c8e6c9;
        }

        .no-documents {
            text-align: center;
            padding: 2rem;
            color: #dc3545;
        }

        .no-documents i {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .student-notes {
            margin: 0;
            color: #555;
            line-height: 1.6;
            white-space: pre-wrap;
            font-style: italic;
        }

        /* Evaluation Section */
        .evaluation-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.25rem;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 0 1rem 0;
            color: #333;
            font-size: 1rem;
        }

        .section-title i {
            color: #8B1538;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-field.full-width {
            grid-column: 1 / -1;
        }

        .form-field label {
            font-size: 0.85rem;
            font-weight: 500;
            color: #555;
        }

        .form-field textarea {
            width: 100%;
            border-radius: 8px;
        }

        /* Dialog Footer */
        .dialog-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }

        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }

        /* Preview Dialog */
        :host ::ng-deep .preview-dialog-content {
            padding: 0 !important;
            height: calc(90vh - 100px);
            overflow: hidden;
        }

        .preview-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #1a1a1a;
        }

        .preview-frame {
            width: 100%;
            height: 100%;
            border: none;
        }

        .preview-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .preview-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #666;
        }

        /* Reject Dialog */
        .reject-content {
            padding: 0.5rem 0;
        }

        .reject-warning {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
            background: #fff3e0;
            border-radius: 8px;
            margin-bottom: 1.5rem;
        }

        .reject-warning i {
            font-size: 1.5rem;
            color: #f57c00;
        }

        .reject-warning p {
            margin: 0;
            color: #555;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }

            .academic-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .dialog-footer {
                flex-direction: column;
                gap: 1rem;
            }
        }
    `]
})
export class RoutingComponent implements OnInit {
    applications = signal<Application[]>([]);

    // Dialog states
    reviewDialogVisible = false;
    rejectDialogVisible = false;
    previewDialogVisible = false;
    selectedApplication: Application | null = null;

    // Preview state
    previewUrl: SafeResourceUrl | null = null;
    isPreviewPdf = false;
    previewLoading = false;

    // Pre-review form
    preReviewDecision = '';
    preReviewNotes = '';
    preReviewConditions = '';
    rejectReason = '';

    preReviewOptions = [
        { label: 'Bölüme Gönderilsin', value: 'APPROVE_FOR_ROUTING' },
        { label: 'Şartlı Kabul', value: 'CONDITIONAL' },
        { label: 'Reddedilsin', value: 'REJECT' }
    ];

    documentTypeNames: Record<string, string> = {
        TRANSCRIPT: 'Transkript',
        OSYM_RESULT: 'ÖSYM Sonuç Belgesi',
        ENGLISH_PROFICIENCY: 'İngilizce Yeterlilik',
        IDENTITY: 'Kimlik Belgesi',
        STUDENT_CERTIFICATE: 'Öğrenci Belgesi',
        COURSE_CONTENTS: 'Ders İçerikleri',
        OSYM_PLACEMENT: 'ÖSYM Yerleştirme Belgesi',
        INTIBAK: 'İntibak Formu',
        OTHER: 'Diğer'
    };

    constructor(
        private applicationService: ApplicationService,
        private facultyService: FacultyService,
        private documentService: DocumentService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.loadApplications();
    }

    private loadApplications() {
        this.applicationService.getAll({ status: ApplicationStatus.FACULTY_ROUTING }).subscribe(apps => {
            this.applications.set(apps);
        });
    }

    getDocumentTypeName(type: string): string {
        return this.documentTypeNames[type] || type;
    }

    showReviewDialog(app: Application) {
        this.selectedApplication = app;
        this.preReviewDecision = '';
        this.preReviewNotes = '';
        this.preReviewConditions = '';
        this.reviewDialogVisible = true;
    }

    showRejectDialog(app: Application) {
        this.selectedApplication = app;
        this.rejectReason = '';
        this.rejectDialogVisible = true;
    }

    previewDocument(doc: Document) {
        this.previewLoading = true;
        this.previewDialogVisible = true;
        this.previewUrl = null;

        this.documentService.download(doc.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                this.isPreviewPdf = doc.mimeType === 'application/pdf' || doc.fileName?.toLowerCase().endsWith('.pdf');
                this.previewLoading = false;
            },
            error: () => {
                this.previewLoading = false;
                this.previewDialogVisible = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Belge önizlemesi yüklenemedi.'
                });
            }
        });
    }

    downloadDocument(doc: Document) {
        this.documentService.download(doc.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.originalName;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Belge indirilemedi.'
                });
            }
        });
    }

    confirmRouteToDepartment(app: Application) {
        this.confirmationService.confirm({
            message: `${app.applicationNumber} numaralı başvuruyu bölüme göndermek istediğinize emin misiniz?`,
            header: 'Onay',
            icon: 'pi pi-question-circle',
            acceptLabel: 'Evet, Gönder',
            rejectLabel: 'Vazgeç',
            accept: () => {
                this.routeToDepartment(app);
            }
        });
    }

    routeToDepartment(app: Application) {
        this.applicationService.routeToDepartment(app.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: 'Başvuru bölüme yönlendirildi.'
                });
                this.loadApplications();
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

    approveAndRoute() {
        if (!this.selectedApplication) return;

        const notes = this.preReviewConditions
            ? `Şartlı Kabul: ${this.preReviewConditions}\n${this.preReviewNotes}`
            : this.preReviewNotes;

        // Update application notes if any
        if (notes) {
            this.applicationService.update(this.selectedApplication.id, { notes }).subscribe();
        }

        this.applicationService.routeToDepartment(this.selectedApplication.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: 'Başvuru incelendi ve bölüme yönlendirildi.'
                });
                this.reviewDialogVisible = false;
                this.loadApplications();
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

    rejectFromReview() {
        if (!this.selectedApplication) return;
        this.rejectReason = this.preReviewNotes || '';
        this.reviewDialogVisible = false;
        this.rejectDialogVisible = true;
    }

    confirmReject() {
        if (!this.selectedApplication || !this.rejectReason) return;

        this.facultyService.rejectApplication(
            this.selectedApplication.id,
            this.rejectReason,
            this.preReviewNotes
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: 'Başvuru reddedildi.'
                });
                this.rejectDialogVisible = false;
                this.loadApplications();
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
}
