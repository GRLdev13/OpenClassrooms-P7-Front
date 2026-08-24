import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConversationDto, CreateConversationDto, GetConversationByUsersDto } from '../Dtos/conversation.dto';
import { API_CONFIG } from './api.config';
import { Message } from '../Dtos/message.dto';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly ROUTE = 'conversations';

  getConversationById(id: string): Observable<ConversationDto> {
    return this.http.get<ConversationDto>(
      `${API_CONFIG}/${this.ROUTE}/${encodeURIComponent(id)}`,
    );
  }

    getConversationByUsers(idUser: string, idAdmin:string): Observable<GetConversationByUsersDto> {
    return this.http.post<GetConversationByUsersDto>(
      `${API_CONFIG}/${this.ROUTE}/`, {user:idUser,admin:idAdmin}
    );
  }

  createConversation(
    conv : CreateConversationDto 
  ): Observable<HttpResponse<ConversationDto>> {

    return this.http.post<ConversationDto>(
      `${API_CONFIG}/${this.ROUTE}`,
      conv,
      { observe: 'response' },
    );
  }
      postMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(`${API_CONFIG}/${this.ROUTE}/${message.id_conversation}/}`, message);
  }
}
