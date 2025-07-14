import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';

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
    }
];
