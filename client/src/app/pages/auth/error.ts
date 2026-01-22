import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-error',
    standalone: true,
    imports: [ButtonModule, RouterModule],
    template: `
        <div class="error-container">
            <div class="error-card">
                <div class="icon-container">
                    <i class="pi pi-exclamation-circle"></i>
                </div>
                <h1 class="error-title">Error Occurred</h1>
                <p class="error-message">The requested resource is not available or an unexpected error has occurred.</p>
                <p class="error-message">Please try again or contact support if the problem persists.</p>
                <p-button
                    label="Return to Login"
                    routerLink="/auth/login"
                    styleClass="return-button"
                ></p-button>
            </div>
        </div>
    `,
    styles: [`
        .error-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            padding: 1rem;
        }

        .error-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 3rem;
            width: 100%;
            max-width: 480px;
            text-align: center;
        }

        .icon-container {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #fce4ec;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }

        .icon-container i {
            font-size: 2.5rem;
            color: #8B1538;
        }

        .error-title {
            color: #333;
            font-size: 2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
        }

        .error-message {
            color: #666;
            font-size: 1rem;
            margin: 0 0 0.5rem 0;
            line-height: 1.5;
        }

        :host ::ng-deep .return-button {
            margin-top: 2rem;
            background-color: #8B1538 !important;
            border-color: #8B1538 !important;
            border-radius: 24px !important;
            padding: 0.875rem 2rem !important;
        }

        :host ::ng-deep .return-button:hover {
            background-color: #6d1029 !important;
            border-color: #6d1029 !important;
        }
    `]
})
export class Error {}
