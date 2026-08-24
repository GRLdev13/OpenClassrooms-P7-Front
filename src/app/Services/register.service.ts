import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { register } from '../Dtos/register.dto';
import { API_CONFIG } from './api.config';

@Injectable({ providedIn: 'root' })
export class RegisterService {
	private readonly http = inject(HttpClient);

	register(details: register): Observable<register> {
		return this.http.post<register>(`${API_CONFIG}/register`, details);
	}
}
