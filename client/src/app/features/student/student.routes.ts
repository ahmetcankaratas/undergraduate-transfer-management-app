import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models';

export const STUDENT_ROUTES: Routes = [
    {
        path: '',
        data: { roles: [UserRole.STUDENT] },
        canActivate: [roleGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
            },
            {
                path: 'new-application',
                loadComponent: () => import('./pages/new-application/new-application.component').then(m => m.NewApplicationComponent)
            },
            {
                path: 'my-applications',
                loadComponent: () => import('./pages/my-applications/my-applications.component').then(m => m.MyApplicationsComponent)
            },
            {
                path: 'applications/:id',
                loadComponent: () => import('./pages/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent)
            },
            {
                path: 'notifications',
                loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent)
            },
            {
                path: 'results',
                loadComponent: () => import('./pages/results/results.component').then(m => m.StudentResultsComponent)
            }
        ]
    }
];
