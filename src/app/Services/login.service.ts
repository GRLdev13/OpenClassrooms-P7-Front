import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { login } from '../Dtos/login.dto';

@Injectable({ providedIn: 'root' })
export class LoginService {
	private readonly http = inject(HttpClient);
	private readonly endpoint = '/api/login';

	login(credentials: login): Observable<login> {
		return this.http.post<login>(this.endpoint, credentials);
	}
}
