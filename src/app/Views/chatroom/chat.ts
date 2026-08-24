import { Component, inject } from '@angular/core';
import { Message } from '../../Dtos/message.dto';
import { UserDto } from '../../Dtos/user.dto';
import { ConversationService } from '../../Services/conversation.service';
import { WebsocketService } from '../../Services/websocket.service';

interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  initials: string;
}

@Component({
  selector: 'app-chatroom',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chatroom {
  readonly websocketService = inject(WebsocketService);
  private readonly conversationService = inject(ConversationService);
  readonly currentUser = this.readCurrentUser();

  readonly suggestedConversations: Conversation[] = [
    { id: 'main', title: 'General chat', subtitle: 'Everyone', initials: 'GC' },
  ];

  openConversations: Conversation[] = [];
  minimizedConversationIds = new Set<string>();
  drafts: Record<string, string> = {};

  constructor() {
    this.openConversation(this.suggestedConversations[0]);
  }

  openConversation(conversation: Conversation): void {
    if (!this.openConversations.some(({ id }) => id === conversation.id)) {
      this.openConversations = [...this.openConversations, conversation];
    }

    this.minimizedConversationIds.delete(conversation.id);
    this.websocketService.joinRoom(conversation.id, this.currentUser);
    this.restoreConversation(conversation.id);
  }

  openUserConversation(user: UserDto): void {
    const roomId = `direct:${[this.currentUser.id, user.id].sort().join(':')}`;
    this.openConversation({
      id: roomId,
      title: user.name,
      subtitle: 'Active now',
      initials: this.initials(user.name),
    });
  }

  closeConversation(roomId: string): void {
    this.openConversations = this.openConversations.filter(({ id }) => id !== roomId);
    this.minimizedConversationIds.delete(roomId);
    this.websocketService.leaveRoom(roomId);
  }

  toggleMinimized(roomId: string): void {
    if (this.minimizedConversationIds.has(roomId)) {
      this.minimizedConversationIds.delete(roomId);
      return;
    }

    this.minimizedConversationIds.add(roomId);
  }

  isMinimized(roomId: string): boolean {
    return this.minimizedConversationIds.has(roomId);
  }

  messagesFor(roomId: string): Message[] {
    return this.websocketService.messages().filter(
      (message) => message.id_conversation === roomId,
    );
  }

  isOwnMessage(message: Message): boolean {
    return message.id_sender === this.currentUser.id;
  }

  updateDraft(roomId: string, event: Event): void {
    this.drafts = {
      ...this.drafts,
      [roomId]: (event.target as HTMLTextAreaElement).value,
    };
  }

  sendMessage(conversation: Conversation): void {
    const text = (this.drafts[conversation.id] ?? '').trim();

    if (!text) {
      return;
    }

    this.websocketService.joinAndSend(conversation.id, this.currentUser, text);
    this.drafts = { ...this.drafts, [conversation.id]: '' };
  }

  handleComposerKeydown(event: KeyboardEvent, conversation: Conversation): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(conversation);
    }
  }

  messageTime(value: Date): string {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  private restoreConversation(id: string): void {
    this.conversationService.getConversationById(id).subscribe({
      next: (conversation) => {
        this.websocketService.restoreParticipants(conversation.participants ?? []);
        this.websocketService.restoreHistory(conversation.messages ?? []);
      },
      // Live chat remains available if history cannot be loaded.
      error: () => undefined,
    });
  }

  private readCurrentUser(): UserDto {
    if (typeof localStorage !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          const user = JSON.parse(storedUser) as Partial<UserDto>;

          if (user.id && user.name) {
            return { id: user.id, name: user.name, email: user.email ?? '' };
          }
        }
      } catch {
        // Ignore malformed stored data and create an anonymous chat identity.
      }
    }

    const id = globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return { id, name: `Guest-${id.slice(0, 5)}`, email: '' };
  }
}
