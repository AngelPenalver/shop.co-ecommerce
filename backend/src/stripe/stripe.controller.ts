import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StripeService } from './stripe.service';

interface RawBodyRequest<T> extends Request {
  rawBody: Buffer;
}

@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly webhookSecret: string;
  private readonly stripeClient: Stripe;

  constructor(
    private readonly stripeService: StripeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService
  ) {
    this.stripeClient = this.stripeService.getStripeClient();
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );
    if (!webhookSecret) {
      throw new Error('Stripe Webhook Secret is not defined');
    }
    this.webhookSecret = webhookSecret;
  }

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }
    if (!req.rawBody) {
      throw new BadRequestException(
        'Webhook request does not contain raw body. Ensure raw body parser is configured correctly for this route.'
      );
    }

    let event: Stripe.Event;
    try {
      event = this.stripeClient.webhooks.constructEvent(
        req.rawBody,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      this.logger.error(
        `⚠️ Webhook signature verification failed: ${err.message}`
      );
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.id}, type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        this.logger.log(
          `CheckoutSession ${session.id} completed. Emitting event 'checkout.session.completed'.`
        );
        this.eventEmitter.emit('checkout.session.completed', session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data
          .object as Stripe.PaymentIntent;
        this.logger.log(
          `PaymentIntent ${paymentIntentSucceeded.id} succeeded. Emitting event 'payment.succeeded'.`
        );
        this.eventEmitter.emit('payment.succeeded', paymentIntentSucceeded);
        break;

      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        this.logger.warn(
          `PaymentIntent ${paymentIntentFailed.id} failed. Emitting event 'payment.failed'.`
        );
        this.eventEmitter.emit('payment.failed', paymentIntentFailed);
        break;

      default:
        this.logger.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}
