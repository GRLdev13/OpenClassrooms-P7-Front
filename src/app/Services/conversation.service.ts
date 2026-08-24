import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConversationDto } from '../Dtos/conversation.dto';
import { API_CONFIG } from './api.config';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly ROUTE = 'conversations';

  getConversationById(id: string): Observable<ConversationDto> {
    return this.http.get<ConversationDto>(
      `${API_CONFIG}/${this.ROUTE}/${encodeURIComponent(id)}`,
    );
  }
}
