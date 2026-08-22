import { Routes } from '@angular/router';
import { LoginView } from './Views/login/login';
import { RegisterView } from './Views/register/register';
import { Chatroom } from './Views/chatroom/chat';

export const routes: Routes = [
  { path: 'login', component: LoginView, title: 'Login' },
  { path: 'register', component: RegisterView, title: 'Register' },
  { path: 'chatroom', component: Chatroom, title: 'Chat Room' },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
