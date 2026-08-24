import { Message } from './message.dto';
import { UserDto } from './user.dto';

export interface CreateConversationDto {
  userIds: [string, string];
}

export class ConversationDto {
  id: string = '';
  participants: UserDto[] = [];
  messages: Message[] = [];
}
