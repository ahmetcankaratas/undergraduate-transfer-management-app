import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="login-container">
            <div class="login-card">
                <h1 class="login-title">Login</h1>

                <div class="login-form">
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

                    <div class="field">
                        <label for="password" class="field-label">Password</label>
                        <p-password
                            id="password"
                            [(ngModel)]="password"
                            placeholder="Enter your password"
                            [toggleMask]="true"
                            [feedback]="false"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                        ></p-password>
                    </div>

                    <div class="auth-links">
                        <a routerLink="/auth/register" class="register-link">Kayıt Ol</a>
                        <a routerLink="/auth/forgot-password" class="forgot-link">Şifremi Unuttum</a>
                    </div>

                    <button
                        pButton
                        type="button"
                        label="CONFIRM"
                        class="confirm-button"
                        (click)="login()"
                        [loading]="loading"
                    ></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }

        .login-container::before {
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

        .login-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 3rem;
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
        }

        .login-title {
            color: #8B1538;
            font-size: 2rem;
            font-weight: 600;
            margin: 0 0 2rem 0;
            text-align: center;
        }

        .login-form {
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

        :host ::ng-deep .p-password {
            width: 100%;
        }

        :host ::ng-deep .p-password-input {
            width: 100%;
            border-radius: 8px;
            padding: 0.75rem 1rem;
        }

        .auth-links {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .register-link,
        .forgot-link {
            color: #666;
            font-size: 0.875rem;
            text-decoration: none;
            transition: color 0.2s;
        }

        .register-link:hover,
        .forgot-link:hover {
            color: #8B1538;
        }

        .register-link {
            font-weight: 500;
        }

        .confirm-button {
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

        .confirm-button:hover {
            background-color: #6d1029 !important;
            border-color: #6d1029 !important;
        }

        .confirm-button:focus {
            box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #8B1538 !important;
        }
    `]
})
export class Login implements OnInit {
    email: string = '';
    password: string = '';
    loading = false;

    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    ngOnInit() {
        // If already logged in, redirect to home
        if (this.authService.authenticated()) {
            this.redirectToHome();
        }
    }

    login() {
        if (!this.email || !this.password) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please enter your email and password.'
            });
            return;
        }

        this.loading = true;
        this.authService.login(this.email, this.password).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Login successful!'
                });
                setTimeout(() => this.redirectToHome(), 500);
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: err.error?.message || 'Invalid credentials.'
                });
            }
        });
    }

    private redirectToHome() {
        const route = this.authService.getDashboardRoute();
        this.router.navigate([route]);
    }
}
