import { Routes } from '@angular/router';
import { Access } from './access';
import { Login } from './login';
import { Register } from './register';
import { Error } from './error';
import { ForgotPassword } from './forgot-password';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'forgot-password', component: ForgotPassword }
] as Routes;
