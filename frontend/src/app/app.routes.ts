import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';
import { Statistics } from './pages/statistics/statistics';
import { AuthGuard } from './services/auth.guard'; // Assuming you have an AuthGuard to protect routes

export const routes: Routes = [
    {
        path: "",
        component: Home
    },
    {
        path: "signup",
        component: Signup
    },
    {
        path: "login",
        component: Login
    },
    {
        path: "statistics",
        component: Statistics,
        canActivate: [AuthGuard] // Assuming you have an AuthGuard to protect this route
    }
];
