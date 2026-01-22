import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models';

export const OIDB_ROUTES: Routes = [
    {
        path: '',
        data: { roles: [UserRole.OIDB_STAFF, UserRole.ADMIN] },
        canActivate: [roleGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/oidb-dashboard.component').then(m => m.OidbDashboardComponent)
            },
            {
                path: 'review',
                loadComponent: () => import('./pages/review/review-applications.component').then(m => m.ReviewApplicationsComponent)
            },
            {
                path: 'applications',
                loadComponent: () => import('./pages/applications/all-applications.component').then(m => m.AllApplicationsComponent)
            },
            {
                path: 'applications/:id',
                loadComponent: () => import('./pages/application-review/application-review.component').then(m => m.ApplicationReviewComponent)
            },
            {
                path: 'announcements',
                loadComponent: () => import('./pages/announcements/announcements.component').then(m => m.AnnouncementsComponent)
            },
            {
                path: 'reports',
                loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
            }
        ]
    }
];
