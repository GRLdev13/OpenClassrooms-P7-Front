import { APP_ID, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { login } from '../Dtos/login.dto';
import { API_CONFIG } from './api.config';

@Injectable({ providedIn: 'root' })
export class LoginService {
	private readonly http = inject(HttpClient);

	login(credentials: login): Observable<login> {
		return this.http.post<login>(`${API_CONFIG}/login`, credentials);
	}
}
