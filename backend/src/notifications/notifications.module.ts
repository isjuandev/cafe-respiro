import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ResendNotificationProvider } from './providers/resend.provider';
import { WebhookNotificationProvider } from './providers/webhook.provider';

@Global()
@Module({
  providers: [
    NotificationsService,
    ResendNotificationProvider,
    WebhookNotificationProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
