import { Message } from './message.dto';
import { UserDto } from './user.dto';

export interface CreateConversationDto {
  userId:string;
  adminUserId: string;
}

export interface GetConversationByUsersDto {
  userIds: [string, string];
}

export class ConversationDto {
  id: string = '';
  participants: UserDto[] = [];
  messages: Message[] = [];
}
