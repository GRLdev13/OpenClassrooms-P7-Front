import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConversationDto } from '../Dtos/conversation.dto';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:3000/api/conversations';

  getConversationById(id: string): Observable<ConversationDto> {
    return this.http.get<ConversationDto>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }
}
