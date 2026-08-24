import { Injectable, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Message } from '../Dtos/message.dto';
import { UserDto } from '../Dtos/user.dto';

type ConnectionStatus = 'offline' | 'connecting' | 'connected';

interface RoomMessagePayload {
  roomId: string;
  message: Message;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly socket: Socket;
  private readonly usersSignal = signal<UserDto[]>([]);
  private readonly messagesSignal = signal<Message[]>([]);
  private readonly statusSignal = signal<ConnectionStatus>('offline');
  private readonly errorSignal = signal<string | null>(null);
  private readonly pendingMessages: Message[] = [];
  private readonly roomUsers = new Map<string, UserDto>();

  readonly users = this.usersSignal.asReadonly();
  readonly messages = this.messagesSignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.socket = io('http://localhost:3000', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.statusSignal.set('connected');
      this.errorSignal.set(null);
      this.joinRoomsAndFlushMessages();
    });

    this.socket.on('disconnect', () => {
      this.statusSignal.set('offline');
    });

    this.socket.on('connect_error', (error: Error) => {
      this.statusSignal.set('offline');
      this.errorSignal.set(error.message || 'Unable to connect to chat.');
    });

    this.socket.on('new-user', (user: UserDto) => {
      this.usersSignal.update((users) =>
        users.some((existingUser) => existingUser.id === user.id)
          ? users
          : [...users, user],
      );
    });

    this.socket.on('user-left', (user: UserDto) => {
      this.usersSignal.update((users) => users.filter(({ id }) => id !== user.id));
    });

    this.socket.on('users', (users: UserDto[]) => {
      this.usersSignal.set(users);
    });

    this.socket.on('new-message', (payload: Message | RoomMessagePayload) => {
      const message = 'roomId' in payload ? payload.message : payload;
      this.addMessageIfMissing(message);
    });
  }

  joinRoom(roomId: string, user: UserDto): void {
    this.roomUsers.set(roomId, user);

    if (this.socket.connected) {
      this.emitRoomJoin(roomId, user);
      return;
    }

    this.statusSignal.set('connecting');
    this.socket.connect();
  }

  leaveRoom(roomId: string): void {
    this.roomUsers.delete(roomId);

    if (this.socket.connected) {
      this.socket.emit('leave-room', roomId);
    }
  }

  restoreHistory(messages: Message[]): void {
    for (const message of messages) {
      this.addMessageIfMissing({
        ...message,
        timeStamp: new Date(message.timeStamp),
      });
    }
  }

  restoreParticipants(participants: UserDto[]): void {
    this.usersSignal.update((users) => {
      const restoredUsers = [...users];

      for (const participant of participants) {
        if (!restoredUsers.some(({ id }) => id === participant.id)) {
          restoredUsers.push(participant);
        }
      }

      return restoredUsers;
    });
  }

  joinAndSend(roomId: string, user: UserDto, text: string): void {
    this.sendMessage({
      id: this.createId(),
      name: user.name,
      message: text,
      timeStamp: new Date(),
      id_conversation: roomId,
      id_sender: user.id,
      status: 'sending',
    }, user);
  }

  disconnect(): void {
    this.socket.disconnect();
    this.resetConnectionState(true);
  }

  leaveChatroom(user: UserDto): void {
    const roomIds = [...this.roomUsers.keys()];

    if (this.socket.connected) {
      this.socket.emit('leave-chatroom', { user, roomIds });
      this.socket.disconnect();
    }

    this.resetConnectionState(false);
  }

  sendMessage(message: Message, user: UserDto): void {
    this.roomUsers.set(message.id_conversation, user);
    this.pendingMessages.push(message);

    if (this.socket.connected) {
      this.emitRoomJoin(message.id_conversation, user);
      this.flushMessages();
      return;
    }

    this.statusSignal.set('connecting');
    this.socket.connect();
  }

  private joinRoomsAndFlushMessages(): void {
    if (!this.socket.connected) {
      return;
    }

    for (const [roomId, user] of this.roomUsers) {
      this.emitRoomJoin(roomId, user);
    }

    this.flushMessages();
  }

  private resetConnectionState(clearMessages: boolean): void {
    this.roomUsers.clear();
    this.pendingMessages.length = 0;
    this.usersSignal.set([]);
    this.errorSignal.set(null);
    this.statusSignal.set('offline');

    if (clearMessages) {
      this.messagesSignal.set([]);
    }
  }

  private emitRoomJoin(roomId: string, user: UserDto): void {
    this.socket.emit('new-user', user);
    this.socket.emit('join-room', { roomId, user });
  }

  private flushMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();

      if (!message) {
        continue;
      }

      this.addMessageIfMissing(message);
      this.socket.emit('send-message', {
        roomId: message.id_conversation,
        message,
      } satisfies RoomMessagePayload);
    }
  }

  private addMessageIfMissing(message: Message): void {
    this.messagesSignal.update((messages) =>
      messages.some((existingMessage) => existingMessage.id === message.id)
        ? messages
        : [...messages, message],
    );
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
