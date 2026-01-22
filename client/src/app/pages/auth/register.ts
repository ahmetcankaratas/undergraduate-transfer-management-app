import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="register-container">
            <div class="register-card">
                <h1 class="register-title">Kayıt Ol</h1>

                <div class="register-form">
                    <div class="field">
                        <label for="firstName" class="field-label">Ad</label>
                        <input
                            pInputText
                            id="firstName"
                            type="text"
                            [(ngModel)]="firstName"
                            placeholder="Adınızı girin"
                            class="w-full"
                        />
                    </div>

                    <div class="field">
                        <label for="lastName" class="field-label">Soyad</label>
                        <input
                            pInputText
                            id="lastName"
                            type="text"
                            [(ngModel)]="lastName"
                            placeholder="Soyadınızı girin"
                            class="w-full"
                        />
                    </div>

                    <div class="field">
                        <label for="email" class="field-label">Email</label>
                        <input
                            pInputText
                            id="email"
                            type="email"
                            [(ngModel)]="email"
                            placeholder="Email adresinizi girin"
                            class="w-full"
                        />
                    </div>

                    <div class="field">
                        <label for="password" class="field-label">Şifre</label>
                        <p-password
                            id="password"
                            [(ngModel)]="password"
                            placeholder="Şifrenizi girin"
                            [toggleMask]="true"
                            [feedback]="true"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                        ></p-password>
                    </div>

                    <div class="field">
                        <label for="confirmPassword" class="field-label">Şifre Tekrar</label>
                        <p-password
                            id="confirmPassword"
                            [(ngModel)]="confirmPassword"
                            placeholder="Şifrenizi tekrar girin"
                            [toggleMask]="true"
                            [feedback]="false"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                        ></p-password>
                    </div>

                    <div class="auth-links">
                        <a routerLink="/auth/login" class="login-link">Zaten hesabınız var mı? Giriş Yap</a>
                    </div>

                    <button
                        pButton
                        type="button"
                        label="KAYIT OL"
                        class="register-button"
                        (click)="register()"
                        [loading]="loading"
                    ></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .register-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }

        .register-container::before {
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

        .register-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 3rem;
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
        }

        .register-title {
            color: #8B1538;
            font-size: 2rem;
            font-weight: 600;
            margin: 0 0 2rem 0;
            text-align: center;
        }

        .register-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
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

        :host ::ng-deep .p-password {
            width: 100%;
        }

        :host ::ng-deep .p-password-input {
            width: 100%;
            border-radius: 8px;
            padding: 0.75rem 1rem;
        }

        .auth-links {
            text-align: center;
        }

        .login-link {
            color: #666;
            font-size: 0.875rem;
            text-decoration: none;
            transition: color 0.2s;
        }

        .login-link:hover {
            color: #8B1538;
        }

        .register-button {
            width: 100%;
            background-color: #8B1538 !important;
            border-color: #8B1538 !important;
            border-radius: 24px !important;
            padding: 0.875rem 1.5rem !important;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-top: 0.5rem;
        }

        .register-button:hover {
            background-color: #6d1029 !important;
            border-color: #6d1029 !important;
        }

        .register-button:focus {
            box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #8B1538 !important;
        }
    `]
})
export class Register {
    firstName: string = '';
    lastName: string = '';
    email: string = '';
    password: string = '';
    confirmPassword: string = '';
    loading = false;

    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    register() {
        if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
            this.messageService.add({
                severity: 'error',
                summary: 'Hata',
                detail: 'Lütfen tüm alanları doldurun.'
            });
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.messageService.add({
                severity: 'error',
                summary: 'Hata',
                detail: 'Şifreler eşleşmiyor.'
            });
            return;
        }

        if (this.password.length < 6) {
            this.messageService.add({
                severity: 'error',
                summary: 'Hata',
                detail: 'Şifre en az 6 karakter olmalıdır.'
            });
            return;
        }

        this.loading = true;
        this.authService.register({
            email: this.email,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Başarılı',
                    detail: 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.'
                });
                setTimeout(() => this.router.navigate(['/auth/login']), 1500);
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Kayıt Başarısız',
                    detail: err.error?.message || 'Kayıt sırasında bir hata oluştu.'
                });
            }
        });
    }
}
