import { Injectable, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Message } from '../Dtos/message.dto';
import { UserDto } from '../Dtos/user.dto';

type ConnectionStatus = 'offline' | 'connecting' | 'connected';

interface RoomContext {
  roomId: string;
  user: UserDto;
}

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
  private roomContext: RoomContext | null = null;
  private joinedRoom = false;

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
      this.joinRoomAndFlushMessages();
    });

    this.socket.on('disconnect', () => {
      this.joinedRoom = false;
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

    this.socket.on('new-message', (payload: Message | RoomMessagePayload) => {
      const message = 'roomId' in payload ? payload.message : payload;
      this.addMessageIfMissing(message);
    });
  }

  joinAndSend(roomId: string, user: UserDto, text: string): void {
    this.roomContext = { roomId, user };
    this.pendingMessages.push({
      id: this.createId(),
      name: user.name,
      message: text,
      timeStamp: new Date(),
      id_conversation: roomId,
      id_sender: user.id,
      status: 'sending',
    });

    if (this.socket.connected) {
      this.joinRoomAndFlushMessages();
      return;
    }

    this.statusSignal.set('connecting');
    this.socket.connect();
  }

  private joinRoomAndFlushMessages(): void {
    if (!this.roomContext || !this.socket.connected) {
      return;
    }

    if (!this.joinedRoom) {
      this.socket.emit('new-user', this.roomContext.user);
      this.socket.emit('join-room', this.roomContext);
      this.joinedRoom = true;
    }

    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();

      if (!message) {
        continue;
      }

      this.addMessageIfMissing(message);
      this.socket.emit('send-message', {
        roomId: this.roomContext.roomId,
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
