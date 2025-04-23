import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeWebhookController } from './stripe.controller';
import { StripeService } from './stripe.service';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

@Module({
  imports: [ConfigModule],
  controllers: [StripeWebhookController],
  providers: [
    {
      provide: STRIPE_CLIENT,
      useFactory: (configService: ConfigService): Stripe => {
        const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
          throw new Error(
            'Stripe Secret Key is not defined in environment variables'
          );
        }
        return new Stripe(secretKey, { apiVersion: '2025-03-31.basil' });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  exports: [STRIPE_CLIENT, StripeService],
})
export class StripeModule {}
