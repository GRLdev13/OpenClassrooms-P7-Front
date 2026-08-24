import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Message } from '../Dtos/message.dto';
import { API_CONFIG } from './api.config';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly ROUTE = 'messages';

  postMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(`${API_CONFIG}/${this.ROUTE}`, message);
  }
}
