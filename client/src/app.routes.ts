import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/guards';

export const appRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth/login'
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            {
                path: 'student',
                loadChildren: () => import('./app/features/student/student.routes').then(m => m.STUDENT_ROUTES)
            },
            {
                path: 'oidb',
                loadChildren: () => import('./app/features/oidb/oidb.routes').then(m => m.OIDB_ROUTES)
            },
            {
                path: 'faculty',
                loadChildren: () => import('./app/features/faculty/faculty.routes').then(m => m.FACULTY_ROUTES)
            },
            {
                path: 'ygk',
                loadChildren: () => import('./app/features/ygk/ygk.routes').then(m => m.YGK_ROUTES)
            },
            {
                path: 'admin',
                loadChildren: () => import('./app/features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
            }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];