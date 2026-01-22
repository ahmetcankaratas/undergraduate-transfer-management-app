import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { YgkService, Evaluation } from '../../services/ygk.service';
import { Application } from '../../../../core/models';

@Component({
    selector: 'app-evaluate',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputNumberModule,
        TextareaModule,
        ToastModule,
        TagModule,
        DividerModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="evaluate-container">
            <div class="page-header">
                <div class="header-content">
                    <h1>Başvuru Değerlendirme</h1>
                    <p class="subtitle">YGK değerlendirmesi bekleyen başvurular</p>
                </div>
                <div class="header-stats">
                    <div class="stat-item">
                        <span class="stat-value">{{ applications().length }}</span>
                        <span class="stat-label">Bekleyen</span>
                    </div>
                </div>
            </div>

            <div class="applications-grid">
                <div *ngFor="let app of applications()" class="application-card" (click)="openEvaluationDialog(app)">
                    <div class="card-header">
                        <span class="app-number">{{ app.applicationNumber }}</span>
                        <p-tag [value]="getStatusLabel(app.status)" [severity]="getStatusSeverity(app.status)" [rounded]="true"></p-tag>
                    </div>
                    <div class="card-body">
                        <div class="student-name">
                            <i class="pi pi-user"></i>
                            {{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}
                        </div>
                        <div class="info-row">
                            <i class="pi pi-building"></i>
                            <span>{{ app.student?.currentUniversity }}</span>
                        </div>
                        <div class="info-row target">
                            <i class="pi pi-arrow-right"></i>
                            <span>{{ app.targetDepartment }}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="gpa-badge" [class.high]="(app.declaredGpa ?? 0) >= 3.5" [class.medium]="(app.declaredGpa ?? 0) >= 3.0 && (app.declaredGpa ?? 0) < 3.5" [class.low]="(app.declaredGpa ?? 0) < 3.0">
                            <span class="gpa-label">GPA</span>
                            <span class="gpa-value">{{ app.declaredGpa?.toFixed(2) || '-' }}</span>
                        </div>
                        <button class="evaluate-btn">
                            <i class="pi pi-pencil"></i>
                            Değerlendir
                        </button>
                    </div>
                </div>

                <div *ngIf="applications().length === 0" class="empty-state">
                    <i class="pi pi-check-circle"></i>
                    <h3>Tüm başvurular değerlendirildi</h3>
                    <p>Şu anda değerlendirilecek başvuru bulunmuyor.</p>
                </div>
            </div>
        </div>

        <!-- Değerlendirme Dialog -->
        <p-dialog
            [(visible)]="evaluationDialogVisible"
            [modal]="true"
            [style]="{width: '800px', maxHeight: '90vh'}"
            [closable]="!isLoading"
            [showHeader]="false"
            styleClass="evaluation-dialog"
        >
            <div class="dialog-content" *ngIf="selectedApplication">
                <!-- Dialog Header -->
                <div class="dialog-header">
                    <div class="dialog-title">
                        <h2>Başvuru Değerlendirme</h2>
                        <span class="app-id">{{ selectedApplication.applicationNumber }}</span>
                    </div>
                    <button class="close-btn" (click)="closeDialog()" [disabled]="isLoading">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <!-- Öğrenci Bilgi Kartı -->
                <div class="student-info-card">
                    <div class="student-avatar">
                        <i class="pi pi-user"></i>
                    </div>
                    <div class="student-details">
                        <h3>{{ selectedApplication.student?.user?.firstName }} {{ selectedApplication.student?.user?.lastName }}</h3>
                        <div class="detail-row">
                            <span class="label">Mevcut Üniversite:</span>
                            <span class="value">{{ selectedApplication.student?.currentUniversity }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Mevcut Bölüm:</span>
                            <span class="value">{{ selectedApplication.student?.currentDepartment }}</span>
                        </div>
                    </div>
                    <div class="target-info">
                        <div class="target-label">Hedef Program</div>
                        <div class="target-dept">{{ selectedApplication.targetDepartment }}</div>
                        <div class="target-faculty">{{ selectedApplication.targetFaculty }}</div>
                    </div>
                </div>

                <!-- Beyan Edilen Bilgiler (Rapor) -->
                <div class="section-card report-section">
                    <div class="section-header">
                        <i class="pi pi-file-edit"></i>
                        <span>Öğrenci Beyanı</span>
                    </div>
                    <div class="report-grid">
                        <div class="report-item">
                            <span class="report-label">Beyan GPA</span>
                            <span class="report-value">{{ selectedApplication.declaredGpa?.toFixed(2) || '-' }}</span>
                        </div>
                        <div class="report-item">
                            <span class="report-label">Beyan ÖSYM Puanı</span>
                            <span class="report-value">{{ selectedApplication.declaredOsymScore?.toFixed(3) || '-' }}</span>
                        </div>
                        <div class="report-item">
                            <span class="report-label">Beyan ÖSYM Sıralaması</span>
                            <span class="report-value">{{ selectedApplication.declaredOsymRank ? (selectedApplication.declaredOsymRank | number) : '-' }}</span>
                        </div>
                        <div class="report-item">
                            <span class="report-label">ÖSYM Yılı</span>
                            <span class="report-value">{{ selectedApplication.declaredOsymYear || '-' }}</span>
                        </div>
                    </div>
                </div>

                <!-- İngilizce Yeterlilik Raporu -->
                <div class="section-card english-section">
                    <div class="section-header">
                        <i class="pi pi-globe"></i>
                        <span>İngilizce Yeterlilik Durumu</span>
                    </div>
                    <div class="english-report">
                        <div class="english-status" [class.eligible]="englishEligibilityStatus.isEligible" [class.not-eligible]="!englishEligibilityStatus.isEligible">
                            <i [class]="englishEligibilityStatus.isEligible ? 'pi pi-check-circle' : 'pi pi-info-circle'"></i>
                            <div class="status-text">
                                <span class="status-title">{{ englishEligibilityStatus.title }}</span>
                                <span class="status-detail">{{ englishEligibilityStatus.detail }}</span>
                            </div>
                        </div>
                        <div class="english-note" *ngIf="englishEligibilityStatus.note">
                            <i class="pi pi-bookmark"></i>
                            {{ englishEligibilityStatus.note }}
                        </div>
                    </div>
                </div>

                <!-- Doğrulama Formu -->
                <div class="section-card verification-section">
                    <div class="section-header">
                        <i class="pi pi-verified"></i>
                        <span>Doğrulama ve Değerlendirme</span>
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Doğrulanmış GPA <span class="required">*</span></label>
                            <p-inputNumber
                                [(ngModel)]="verifiedGpa"
                                [min]="0"
                                [max]="4"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="2"
                                placeholder="0.00"
                                styleClass="w-full"
                            ></p-inputNumber>
                            <small>4.00 üzerinden, minimum 2.50 olmalı</small>
                        </div>
                        <div class="form-group">
                            <label>Doğrulanmış ÖSYM Puanı <span class="required">*</span></label>
                            <p-inputNumber
                                [(ngModel)]="verifiedOsymScore"
                                [min]="0"
                                [max]="500"
                                [minFractionDigits]="3"
                                [maxFractionDigits]="3"
                                placeholder="0.000"
                                styleClass="w-full"
                            ></p-inputNumber>
                        </div>
                        <div class="form-group">
                            <label>Doğrulanmış ÖSYM Sıralaması <span class="required">*</span></label>
                            <p-inputNumber
                                [(ngModel)]="verifiedOsymRank"
                                [min]="1"
                                [max]="3000000"
                                [useGrouping]="true"
                                placeholder="Örn: 150.000"
                                styleClass="w-full"
                            ></p-inputNumber>
                            <small>{{ getRankLimit() }}</small>
                        </div>
                        <div class="form-group">
                            <label>ÖSYM Yılı <span class="required">*</span></label>
                            <p-inputNumber
                                [(ngModel)]="verifiedOsymYear"
                                [min]="2015"
                                [max]="2030"
                                [useGrouping]="false"
                                placeholder="2026"
                                styleClass="w-full"
                            ></p-inputNumber>
                        </div>
                    </div>
                    <div class="notes-group">
                        <label>Değerlendirme Notları</label>
                        <textarea
                            pTextarea
                            [(ngModel)]="evaluationNotes"
                            rows="3"
                            placeholder="Değerlendirme ile ilgili notlarınızı buraya yazabilirsiniz..."
                            class="w-full"
                        ></textarea>
                    </div>
                </div>

                <!-- Sonuç Gösterimi -->
                <div *ngIf="evaluationResult" class="result-card" [class.success]="evaluationResult.isOverallEligible" [class.failure]="!evaluationResult.isOverallEligible">
                    <div class="result-icon">
                        <i [class]="evaluationResult.isOverallEligible ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-score">
                            <span class="score-label">Hesaplanan Yatay Geçiş Puanı</span>
                            <span class="score-value">{{ evaluationResult.compositeScore?.toFixed(2) || '0.00' }}</span>
                        </div>
                        <div class="result-details">
                            <div class="detail-chip" [class.pass]="evaluationResult.isGpaEligible" [class.fail]="!evaluationResult.isGpaEligible">
                                <i [class]="evaluationResult.isGpaEligible ? 'pi pi-check' : 'pi pi-times'"></i>
                                GPA Yeterliliği
                            </div>
                            <div class="detail-chip" [class.pass]="evaluationResult.isOsymRankEligible" [class.fail]="!evaluationResult.isOsymRankEligible">
                                <i [class]="evaluationResult.isOsymRankEligible ? 'pi pi-check' : 'pi pi-times'"></i>
                                Sıralama Yeterliliği
                            </div>
                            <div class="detail-chip" [class.pass]="evaluationResult.isEnglishEligible" [class.fail]="!evaluationResult.isEnglishEligible">
                                <i [class]="evaluationResult.isEnglishEligible ? 'pi pi-check' : 'pi pi-times'"></i>
                                İngilizce Yeterliliği
                            </div>
                        </div>
                        <div *ngIf="evaluationResult.eligibilityNotes" class="result-notes">
                            {{ evaluationResult.eligibilityNotes }}
                        </div>
                    </div>
                    <div class="result-badge">
                        {{ evaluationResult.isOverallEligible ? 'UYGUN' : 'UYGUN DEĞİL' }}
                    </div>
                </div>

                <!-- Puan Hesaplama Açıklaması -->
                <div class="section-card formula-section">
                    <div class="section-header">
                        <i class="pi pi-calculator"></i>
                        <span>Puan Hesaplama Formülü (Yönerge MADDE 9-4)</span>
                    </div>
                    <div class="formula-content">
                        <div class="formula-box">
                            <div class="formula-title">Yatay Geçiş Puanı</div>
                            <div class="formula-equation">
                                <span class="formula-part">(</span>
                                <span class="formula-variable">ÖSYM Puanı</span>
                                <span class="formula-operator">/</span>
                                <span class="formula-variable">Taban Puan</span>
                                <span class="formula-part">)</span>
                                <span class="formula-operator">×</span>
                                <span class="formula-constant">100</span>
                                <span class="formula-operator">×</span>
                                <span class="formula-constant">0.90</span>
                                <span class="formula-operator">+</span>
                                <span class="formula-variable">GPA<sub>100</sub></span>
                                <span class="formula-operator">×</span>
                                <span class="formula-constant">0.10</span>
                            </div>
                        </div>
                        <div class="formula-legend">
                            <div class="legend-item">
                                <span class="legend-label">ÖSYM Puanı:</span>
                                <span class="legend-value">{{ verifiedOsymScore | number:'1.3-3' }}</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-label">Taban Puan ({{ verifiedOsymYear }}):</span>
                                <span class="legend-value">{{ getProgramBaseScore() | number:'1.3-3' }}</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-label">GPA (100'lük):</span>
                                <span class="legend-value">{{ getGpa100() | number:'1.1-1' }}</span>
                            </div>
                        </div>
                        <!-- Hesaplanan Puan -->
                        <div class="calculated-score">
                            <div class="score-label">Hesaplanan Yatay Geçiş Puanı</div>
                            <div class="score-value">{{ calculatePreviewScore() | number:'1.2-2' }}</div>
                        </div>

                        <div class="formula-note">
                            <i class="pi pi-info-circle"></i>
                            <span>ÖSYM bileşeni %90, GPA bileşeni %10 ağırlığa sahiptir.</span>
                        </div>
                    </div>
                </div>

                <!-- Dialog Footer -->
                <div class="dialog-footer">
                    <button class="btn-secondary" (click)="closeDialog()" [disabled]="isLoading">
                        <i class="pi pi-times"></i>
                        İptal
                    </button>
                    <button class="btn-primary" (click)="saveEvaluation()" [disabled]="isLoading">
                        <i class="pi pi-calculator" *ngIf="!isLoading"></i>
                        <i class="pi pi-spin pi-spinner" *ngIf="isLoading"></i>
                        {{ isLoading ? 'Hesaplanıyor...' : 'Değerlendir ve Kaydet' }}
                    </button>
                </div>
            </div>
        </p-dialog>
    `,
    styles: [`
        .evaluate-container {
            padding: 1.5rem;
            max-width: 1400px;
            margin: 0 auto;
        }

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
            gap: 1.5rem;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: linear-gradient(135deg, #8B1538 0%, #6d1029 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            min-width: 100px;
        }

        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 0.8rem;
            opacity: 0.9;
        }

        /* Applications Grid */
        .applications-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.25rem;
        }

        .application-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid #f0f0f0;
        }

        .application-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08);
            border-color: #8B1538;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            background: #f9fafb;
            border-bottom: 1px solid #f0f0f0;
        }

        .app-number {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 500;
        }

        .card-body {
            padding: 1.25rem;
        }

        .student-name {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1rem;
        }

        .student-name i {
            color: #8B1538;
        }

        .info-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }

        .info-row i {
            font-size: 0.8rem;
            width: 16px;
        }

        .info-row.target {
            color: #8B1538;
            font-weight: 500;
        }

        .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            background: #fafafa;
            border-top: 1px solid #f0f0f0;
        }

        .gpa-badge {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 1rem;
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
            font-size: 0.7rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .gpa-value {
            font-size: 1.1rem;
            font-weight: 700;
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
            cursor: pointer;
            transition: background 0.2s;
        }

        .evaluate-btn:hover {
            background: #6d1029;
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

        /* Dialog Styles */
        :host ::ng-deep .evaluation-dialog .p-dialog-content {
            padding: 0 !important;
            border-radius: 16px;
            overflow: hidden;
        }

        .dialog-content {
            max-height: 85vh;
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

        .dialog-title .app-id {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
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

        /* Student Info Card */
        .student-info-card {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 1.5rem 2rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .student-avatar {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #8B1538 0%, #6d1029 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .student-details {
            flex: 1;
        }

        .student-details h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
            color: #1f2937;
        }

        .detail-row {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
        }

        .detail-row .label {
            color: #9ca3af;
        }

        .target-info {
            text-align: right;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }

        .target-label {
            font-size: 0.75rem;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
        }

        .target-dept {
            font-weight: 600;
            color: #8B1538;
            font-size: 1rem;
        }

        .target-faculty {
            font-size: 0.85rem;
            color: #6b7280;
        }

        /* Section Cards */
        .section-card {
            margin: 1.5rem 2rem;
            background: white;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #374151;
        }

        .section-header i {
            color: #8B1538;
        }

        /* Report Section */
        .report-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1px;
            background: #e5e7eb;
        }

        .report-item {
            display: flex;
            flex-direction: column;
            padding: 1rem 1.25rem;
            background: white;
        }

        .report-label {
            font-size: 0.8rem;
            color: #9ca3af;
            margin-bottom: 0.25rem;
        }

        .report-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
        }

        /* English Section */
        .english-report {
            padding: 1.25rem;
        }

        .english-status {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
            border-radius: 8px;
            background: #f9fafb;
        }

        .english-status i {
            font-size: 1.5rem;
            margin-top: 0.25rem;
        }

        .english-status.eligible {
            background: #dcfce7;
        }

        .english-status.eligible i {
            color: #16a34a;
        }

        .english-status.not-eligible {
            background: #fef3c7;
        }

        .english-status.not-eligible i {
            color: #d97706;
        }

        .status-text {
            display: flex;
            flex-direction: column;
        }

        .status-title {
            font-weight: 600;
            color: #1f2937;
        }

        .status-detail {
            font-size: 0.9rem;
            color: #6b7280;
            margin-top: 0.25rem;
        }

        .english-note {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1rem;
            padding: 0.75rem 1rem;
            background: #eff6ff;
            border-radius: 8px;
            font-size: 0.9rem;
            color: #1e40af;
        }

        /* Verification Form */
        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
            padding: 1.25rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            font-size: 0.9rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
        }

        .form-group .required {
            color: #dc2626;
        }

        .form-group small {
            font-size: 0.8rem;
            color: #9ca3af;
            margin-top: 0.25rem;
        }

        .notes-group {
            padding: 0 1.25rem 1.25rem 1.25rem;
        }

        .notes-group label {
            display: block;
            font-size: 0.9rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
        }

        /* Result Card */
        .result-card {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin: 1.5rem 2rem;
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid;
        }

        .result-card.success {
            background: #f0fdf4;
            border-color: #16a34a;
        }

        .result-card.failure {
            background: #fef2f2;
            border-color: #dc2626;
        }

        .result-icon i {
            font-size: 3rem;
        }

        .result-card.success .result-icon i {
            color: #16a34a;
        }

        .result-card.failure .result-icon i {
            color: #dc2626;
        }

        .result-content {
            flex: 1;
        }

        .result-score {
            display: flex;
            flex-direction: column;
            margin-bottom: 0.75rem;
        }

        .score-label {
            font-size: 0.85rem;
            color: #6b7280;
        }

        .score-value {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
        }

        .result-details {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .detail-chip {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .detail-chip.pass {
            background: #dcfce7;
            color: #16a34a;
        }

        .detail-chip.fail {
            background: #fee2e2;
            color: #dc2626;
        }

        .result-notes {
            margin-top: 0.75rem;
            font-size: 0.9rem;
            color: #6b7280;
        }

        .result-badge {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
        }

        .result-card.success .result-badge {
            background: #16a34a;
            color: white;
        }

        .result-card.failure .result-badge {
            background: #dc2626;
            color: white;
        }

        /* Dialog Footer */
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

        .btn-secondary, .btn-primary {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 0.95rem;
        }

        .btn-secondary {
            background: white;
            color: #6b7280;
            border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover:not(:disabled) {
            background: #f3f4f6;
        }

        .btn-primary {
            background: #8B1538;
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background: #6d1029;
        }

        .btn-primary:disabled, .btn-secondary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        @media (max-width: 768px) {
            .applications-grid {
                grid-template-columns: 1fr;
            }

            .student-info-card {
                flex-direction: column;
                text-align: center;
            }

            .target-info {
                text-align: center;
                width: 100%;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .report-grid {
                grid-template-columns: 1fr;
            }

            .result-card {
                flex-direction: column;
                text-align: center;
            }
        }

        /* Formula Section Styles */
        .formula-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }

        .formula-content {
            padding: 1rem;
        }

        .formula-box {
            background: white;
            border-radius: 8px;
            padding: 1.25rem;
            text-align: center;
            border: 1px solid #e5e7eb;
            margin-bottom: 1rem;
        }

        .formula-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
        }

        .formula-equation {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 0.35rem;
            font-size: 1rem;
        }

        .formula-variable {
            background: #dbeafe;
            color: #1e40af;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 500;
            font-size: 0.85rem;
        }

        .formula-constant {
            background: #dcfce7;
            color: #166534;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.85rem;
        }

        .formula-operator {
            color: #6b7280;
            font-weight: 500;
        }

        .formula-part {
            color: #374151;
            font-weight: 500;
        }

        .formula-legend {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .legend-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: white;
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }

        .legend-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
        }

        .legend-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1f2937;
        }

        .calculated-score {
            background: linear-gradient(135deg, #8B1538 0%, #6d1029 100%);
            border-radius: 12px;
            padding: 1.25rem;
            text-align: center;
            margin-bottom: 1rem;
        }

        .calculated-score .score-label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
        }

        .calculated-score .score-value {
            color: white;
            font-size: 2.5rem;
            font-weight: 700;
        }

        .formula-note {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: #fef3c7;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #92400e;
        }

        .formula-note i {
            font-size: 1rem;
        }

        @media (max-width: 600px) {
            .formula-legend {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class EvaluateComponent implements OnInit {
    applications = signal<Application[]>([]);
    evaluationDialogVisible = false;
    isLoading = false;

    selectedApplication: Application | null = null;
    currentEvaluationId: string | null = null;
    evaluationResult: Evaluation | null = null;

    // Evaluation Form
    verifiedGpa = 0;
    verifiedOsymScore = 0;
    verifiedOsymRank = 0;
    verifiedOsymYear = new Date().getFullYear();
    evaluationNotes = '';

    // English eligibility status (read-only report)
    englishEligibilityStatus = {
        isEligible: false,
        title: 'Belge Bekleniyor',
        detail: 'İngilizce yeterlilik belgesi henüz doğrulanmadı.',
        note: ''
    };

    constructor(
        private ygkService: YgkService,
        private messageService: MessageService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.loadApplications();

        this.route.queryParams.subscribe(params => {
            if (params['applicationId']) {
                this.loadAndOpenApplication(params['applicationId']);
            }
        });
    }

    private loadApplications() {
        this.ygkService.getPendingApplications().subscribe({
            next: (apps) => {
                this.applications.set(apps);
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

    private loadAndOpenApplication(applicationId: string) {
        this.ygkService.getApplication(applicationId).subscribe({
            next: (result) => {
                this.openEvaluationDialog(result.application);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: 'Başvuru bulunamadı.'
                });
            }
        });
    }

    openEvaluationDialog(app: Application) {
        this.selectedApplication = app;
        this.evaluationResult = null;
        this.currentEvaluationId = null;

        // Pre-fill form with declared values
        this.verifiedGpa = app.declaredGpa || 0;
        this.verifiedOsymScore = app.declaredOsymScore || 0;
        this.verifiedOsymRank = app.declaredOsymRank || 0;
        this.verifiedOsymYear = app.declaredOsymYear || new Date().getFullYear();
        this.evaluationNotes = '';

        // Set English eligibility status based on documents/external data
        this.updateEnglishEligibilityStatus(app);

        this.evaluationDialogVisible = true;

        // Start evaluation
        this.ygkService.startEvaluation(app.id).subscribe({
            next: (evaluation) => {
                this.currentEvaluationId = evaluation.id;

                if (evaluation.verifiedGpa) this.verifiedGpa = evaluation.verifiedGpa;
                if (evaluation.verifiedOsymScore) this.verifiedOsymScore = evaluation.verifiedOsymScore;
                if (evaluation.verifiedOsymRank) this.verifiedOsymRank = evaluation.verifiedOsymRank;
                if (evaluation.verifiedOsymYear) this.verifiedOsymYear = evaluation.verifiedOsymYear;
                if (evaluation.isCompleted) this.evaluationResult = evaluation;

                // Update English status from evaluation
                if (evaluation.isEnglishEligible !== undefined) {
                    this.englishEligibilityStatus.isEligible = evaluation.isEnglishEligible;
                    if (evaluation.isEnglishEligible) {
                        this.englishEligibilityStatus.title = 'İngilizce Yeterliliği Var';
                        this.englishEligibilityStatus.detail = evaluation.isIyteEnglishExempt
                            ? 'İYTE İngilizce Hazırlık Programından muaf (MADDE 8)'
                            : 'Dil sınavı yeterlilik şartını karşılıyor';
                    }
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: err.error?.message || 'Değerlendirme başlatılamadı.'
                });
            }
        });
    }

    private updateEnglishEligibilityStatus(app: Application) {
        // Check documents for English proficiency
        const englishDoc = app.documents?.find(d => d.type === 'ENGLISH_PROFICIENCY');

        if (englishDoc) {
            this.englishEligibilityStatus = {
                isEligible: true,
                title: 'İngilizce Belgesi Mevcut',
                detail: 'Öğrenci tarafından İngilizce yeterlilik belgesi yüklenmiş.',
                note: 'Belgenin geçerliliği OIDB tarafından doğrulanmalıdır.'
            };
        } else {
            this.englishEligibilityStatus = {
                isEligible: false,
                title: 'İngilizce Belgesi Bekleniyor',
                detail: 'Öğrenci henüz İngilizce yeterlilik belgesi yüklememiş.',
                note: 'MADDE 8: İYTE hazırlık programı veya muafiyet sınavı ile karşılanabilir.'
            };
        }
    }

    saveEvaluation() {
        if (!this.currentEvaluationId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Hata',
                detail: 'Değerlendirme ID bulunamadı. Sayfayı yenileyin.'
            });
            return;
        }

        // Validation
        if (this.verifiedGpa < 2.5) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Uyarı',
                detail: 'GPA minimum 2.50 olmalıdır.'
            });
            return;
        }

        this.isLoading = true;

        this.ygkService.evaluate(this.currentEvaluationId, {
            verifiedGpa: this.verifiedGpa,
            verifiedOsymScore: this.verifiedOsymScore,
            verifiedOsymRank: this.verifiedOsymRank,
            verifiedOsymYear: this.verifiedOsymYear,
            isEnglishEligible: this.englishEligibilityStatus.isEligible,
            isIyteEnglishExempt: false,
            evaluationNotes: this.evaluationNotes
        }).subscribe({
            next: (result) => {
                this.isLoading = false;
                this.evaluationResult = result;

                if (result.isOverallEligible) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Değerlendirme Tamamlandı',
                        detail: `Hesaplanan puan: ${result.compositeScore?.toFixed(2)}. Aday uygun bulundu.`
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Değerlendirme Tamamlandı',
                        detail: 'Aday uygunluk kriterlerini karşılamıyor.'
                    });
                }

                // Dialog'u kapat ve listeyi yenile
                this.closeDialog();
                this.loadApplications();
            },
            error: (err) => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Hata',
                    detail: err.error?.message || 'Değerlendirme kaydedilemedi.'
                });
            }
        });
    }

    closeDialog() {
        this.evaluationDialogVisible = false;
        this.selectedApplication = null;
        this.currentEvaluationId = null;
        this.evaluationResult = null;
    }

    getRankLimit(): string {
        if (!this.selectedApplication) return '';
        const faculty = this.selectedApplication.targetFaculty;
        if (faculty?.includes('Mühendislik')) return 'Mühendislik: max 300.000';
        if (faculty?.includes('Mimarlık')) return 'Mimarlık: max 250.000';
        return '';
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'DEPARTMENT_ROUTING': 'Bölüme Yönlendirildi',
            'YGK_EVALUATION': 'Değerlendirmede',
            'RANKED': 'Sıralandı',
            'WAITLISTED': 'Yedek Listede',
            'REJECTED': 'Reddedildi'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            'DEPARTMENT_ROUTING': 'warn',
            'YGK_EVALUATION': 'info',
            'RANKED': 'success',
            'WAITLISTED': 'secondary',
            'REJECTED': 'danger'
        };
        return severities[status] || 'secondary';
    }

    /**
     * Program taban puanını döndür
     * Değerlendirme sonucu varsa oradan, yoksa varsayılan değer
     */
    getProgramBaseScore(): number {
        if (this.evaluationResult?.programBaseScore) {
            return this.evaluationResult.programBaseScore;
        }
        // Varsayılan taban puanları (2022 yılı)
        const baseScores: Record<string, number> = {
            'Bilgisayar Mühendisliği': 459,
            'Elektrik-Elektronik Mühendisliği': 420,
            'Makine Mühendisliği': 380,
            'Mimarlık': 350
        };
        return baseScores[this.selectedApplication?.targetDepartment || ''] || 400;
    }

    /**
     * GPA'yı 100'lük sisteme dönüştür (YÖK tablosu)
     */
    getGpa100(): number {
        if (this.evaluationResult?.verifiedGpa100) {
            return this.evaluationResult.verifiedGpa100;
        }
        const gpa = this.verifiedGpa;
        if (gpa >= 4.0) return 100;
        if (gpa >= 3.5) return 85 + (gpa - 3.5) * 30;
        if (gpa >= 3.0) return 70 + (gpa - 3.0) * 30;
        if (gpa >= 2.5) return 60 + (gpa - 2.5) * 20;
        if (gpa >= 2.0) return 50 + (gpa - 2.0) * 20;
        return 0;
    }

    /**
     * Önizleme için yatay geçiş puanını hesapla
     * Formül: (ÖSYM / Taban) * 100 * 0.9 + GPA100 * 0.1
     */
    calculatePreviewScore(): number {
        const baseScore = this.getProgramBaseScore();
        const gpa100 = this.getGpa100();

        if (baseScore <= 0 || this.verifiedOsymScore <= 0) {
            return 0;
        }

        const osymComponent = (this.verifiedOsymScore / baseScore) * 100 * 0.9;
        const gpaComponent = gpa100 * 0.1;

        return osymComponent + gpaComponent;
    }
}
