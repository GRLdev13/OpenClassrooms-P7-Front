import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { WebsocketService } from './Services/websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly websocketService = inject(WebsocketService);
  readonly userEmail = signal(this.readUserEmail());

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.userEmail.set(this.readUserEmail()));
  }

  logout(): void {
    this.websocketService.disconnect();

    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
      this.clearCookies();
    }

    this.userEmail.set('');
    void this.router.navigate(['/login']);
  }

  private clearCookies(): void {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();

      if (name) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    }
  }

  private readUserEmail(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      const storedUser = window.localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) as { email?: string } : null;
      return user?.email ?? '';
    } catch {
      return '';
    }
  }
}
