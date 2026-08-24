import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { register } from '../Dtos/register.dto';

@Injectable({ providedIn: 'root' })
export class RegisterService {
	private readonly http = inject(HttpClient);
	private readonly endpoint = '/api/register';

	register(details: register): Observable<register> {
		return this.http.post<register>(this.endpoint, details);
	}
}
