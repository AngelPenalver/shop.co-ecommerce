import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateStripeDto } from './dto/create-stripe.dto';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Stripe Secret Key is not defined');
    }
    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(
    orderId: string,
    items: {
      name: string;
      unitPrice: number;
      quantity: number;
    }[]
  ): Promise<Stripe.Checkout.Session> {
    const frontendBaseUrl = this.configService.get<string>('FRONTEND_URL');
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${frontendBaseUrl}`,
        cancel_url: `${frontendBaseUrl}`,
        metadata: {
          internal_order_id: orderId,
        },
      });
      return session;
    } catch (error) {
      throw error;
    }
  }

  async createPaymentIntent(createStripeDto: CreateStripeDto) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(createStripeDto.amount * 100),
      currency: 'usd',
      payment_method_types: ['card'],
    });
    return paymentIntent;
  }

  getStripeClient(): Stripe {
    return this.stripe;
  }
}
