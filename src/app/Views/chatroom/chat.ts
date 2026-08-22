import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserDto } from '../../Dtos/user.dto';
import { WebsocketService } from '../../Services/websocket.service';

@Component({
  selector: 'app-chatroom',
  imports: [ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chatroom {
  readonly websocketService = inject(WebsocketService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly roomId = 'main';
  private readonly currentUser = this.readCurrentUser();

  readonly messageForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.required]],
  });

  submitted = false;

  onSubmit(): void {
    this.submitted = true;

    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const text = this.messageForm.controls.message.value.trim();

    if (!text) {
      this.messageForm.controls.message.setErrors({ required: true });
      return;
    }

    this.websocketService.joinAndSend(this.roomId, this.currentUser, text);

    this.messageForm.reset();
    this.submitted = false;
  }

  usernameColor(name: string): string {
    const colors = ['#ff75e6', '#53fc18', '#5b99ff', '#ffb31a', '#bf94ff'];
    const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
    return colors[hash % colors.length];
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
