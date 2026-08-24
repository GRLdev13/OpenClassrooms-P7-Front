import { Component, HostListener, inject, OnDestroy } from '@angular/core';
import { Message } from '../../Dtos/message.dto';
import { UserDto } from '../../Dtos/user.dto';
import { ConversationService } from '../../Services/conversation.service';
import { MessageService } from '../../Services/message.service';
import { WebsocketService } from '../../Services/websocket.service';
import { ConversationDto, CreateConversationDto } from '../../Dtos/conversation.dto';

interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  initials: string;
  adminUser: string;
  normalUser: string;
}

@Component({
  selector: 'app-chatroom',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chatroom implements OnDestroy {
  readonly websocketService = inject(WebsocketService);
  private readonly conversationService = inject(ConversationService);
  private readonly messageService = inject(MessageService);
  readonly currentUser = this.readCurrentUser();

  readonly suggestedConversations: Conversation[] = [
    // { id: 'main', title: 'General chat', subtitle: 'Everyone', initials: 'GC' },
  ];

  openConversations: Conversation[] = [];
  minimizedConversationIds = new Set<string>();
  drafts: Record<string, string> = {};
  private departureNotified = false;

  constructor() {
    this.openConversation(this.suggestedConversations[0]);
  }

  @HostListener('window:pagehide')
  onPageHide(): void {
    this.notifyDeparture();
  }

  ngOnDestroy(): void {
    this.notifyDeparture();
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

    //TODO: get Conversation first
    // if not exists : create it

    this.conversationService
      .createConversation(
        {  
          adminUserId:  user.isAdmin ? this.currentUser.id : user.id,
          userId: user.isAdmin ? user.id : this.currentUser.id
        })
      .subscribe({
        next: (response) => {
          const createdConversation = response.body;

          if (response.status !== 200 || !createdConversation?.id) {
            return;
          }

          const createdAt = new Date();
          const creationMessage = new Message();
          creationMessage.id = globalThis.crypto?.randomUUID?.()
            ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          creationMessage.name = 'System';
          creationMessage.message = `Conversation created with id ${createdConversation.id} at ${createdAt.toLocaleString()}`;
          creationMessage.timeStamp = createdAt;
          creationMessage.id_conversation = createdConversation.id;
          creationMessage.id_sender = 'system';
          creationMessage.status = 'sent';

          this.websocketService.restoreParticipants(createdConversation.participants ?? []);
          this.websocketService.restoreHistory([
            ...(createdConversation.messages ?? []),
            creationMessage,
          ]);

          this.openConversation({
            id: createdConversation.id,
            title: user.email || user.name,
            subtitle: 'Active now',
            initials: this.initials(user.email || user.name),
          });
        },
        error: () => undefined,
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

  isSystemMessage(message: Message): boolean {
    return message.id_sender === 'system';
  }

  updateDraft(roomId: string, event: Event): void {
    this.drafts = {
      ...this.drafts,
      [roomId]: (event.target as HTMLTextAreaElement).value,
    };
  }

  createConversation(conversation: CreateConversationDto)
  {
    this.conversationService.createConversation(conversation).subscribe({
      next: (savedMessage) => {
        const persistedMessage = Object.assign(new Message(), Message, savedMessage);
        this.websocketService.sendMessage(persistedMessage, this.currentUser);

        if(savedMessage.ok && savedMessage.body)
        this.drafts = { ...this.drafts, [savedMessage.body?.id]: '' };
      },
      error: () => //todo throw error
      undefined,
    });
  }

  sendMessage(conversation: Conversation): void {
    const text = (this.drafts[conversation.id] ?? '').trim();

    if (!text) {
      return;
    }

    const message = new Message();
    message.name = this.currentUser.email || this.currentUser.name;
    message.message = text;
    message.timeStamp = new Date();
    message.id_conversation = conversation.id;
    message.id_sender = this.currentUser.id;
    message.status = 'sending';

    this.conversationService.postMessage(message).subscribe({
      next: (savedMessage) => {
        const persistedMessage = Object.assign(new Message(), message, savedMessage);
        this.websocketService.sendMessage(persistedMessage, this.currentUser);
        this.drafts = { ...this.drafts, [conversation.id]: '' };
      },
      error: () => undefined,
    });
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

  private notifyDeparture(): void {
    if (this.departureNotified) {
      return;
    }

    this.departureNotified = true;
    this.websocketService.leaveChatroom(this.currentUser);
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
