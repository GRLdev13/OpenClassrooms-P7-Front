import { Message } from './message.dto';
import { UserDto } from './user.dto';

export class ConversationDto {
  id: string = '';
  participants: UserDto[] = [];
  messages: Message[] = [];
}
