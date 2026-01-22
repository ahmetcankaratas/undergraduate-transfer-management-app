import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [ButtonModule, InputTextModule, FormsModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="forgot-container">
            <div class="forgot-card">
                <h1 class="forgot-title">Forgot Password</h1>
                <p class="forgot-description">
                    Enter your email address and we'll send you instructions to reset your password.
                </p>

                <div class="forgot-form">
                    <div class="field">
                        <label for="email" class="field-label">Email</label>
                        <input
                            pInputText
                            id="email"
                            type="email"
                            [(ngModel)]="email"
                            placeholder="Enter your email"
                            class="w-full"
                        />
                    </div>

                    <button
                        pButton
                        type="button"
                        label="SEND RESET LINK"
                        class="submit-button"
                        (click)="sendResetLink()"
                        [loading]="loading"
                    ></button>

                    <div class="back-to-login">
                        <a routerLink="/auth/login" class="back-link">
                            <i class="pi pi-arrow-left"></i>
                            Back to Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .forgot-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }

        .forgot-container::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background-image: url('/iyte_logo.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.08;
            z-index: 0;
        }

        .forgot-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 3rem;
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
        }

        .forgot-title {
            color: #8B1538;
            font-size: 2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
            text-align: center;
        }

        .forgot-description {
            color: #666;
            font-size: 0.95rem;
            text-align: center;
            margin: 0 0 2rem 0;
            line-height: 1.5;
        }

        .forgot-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .field-label {
            font-weight: 500;
            color: #333;
            font-size: 0.95rem;
        }

        :host ::ng-deep .p-inputtext {
            border-radius: 8px;
            padding: 0.75rem 1rem;
        }

        .submit-button {
            width: 100%;
            background-color: #8B1538 !important;
            border-color: #8B1538 !important;
            border-radius: 24px !important;
            padding: 0.875rem 1.5rem !important;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .submit-button:hover {
            background-color: #6d1029 !important;
            border-color: #6d1029 !important;
        }

        .submit-button:focus {
            box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #8B1538 !important;
        }

        .back-to-login {
            text-align: center;
        }

        .back-link {
            color: #8B1538;
            font-size: 0.95rem;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #6d1029;
        }
    `]
})
export class ForgotPassword {
    email: string = '';
    loading = false;

    private messageService = inject(MessageService);

    sendResetLink() {
        if (!this.email) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please enter your email address.'
            });
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please enter a valid email address.'
            });
            return;
        }

        this.loading = true;

        // Simulate API call - in real implementation, call AuthService
        setTimeout(() => {
            this.loading = false;
            this.messageService.add({
                severity: 'success',
                summary: 'Email Sent',
                detail: 'If an account exists with this email, you will receive password reset instructions.'
            });
            this.email = '';
        }, 1500);
    }
}
