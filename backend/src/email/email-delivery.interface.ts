import type { EmailMessage } from './email.types.js';

export interface EmailDelivery {
  send(message: EmailMessage): Promise<void>;
}
