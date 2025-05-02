import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateStripeDto } from './dto/create-stripe.dto';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Stripe Secret Key is not defined');
    }
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-03-31.basil' });
  }

  async createCheckoutSession(orderId: string, amount: number) {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Order #${orderId}`,
            },
            unit_amount: Math.round(amount * 100), // Convertir a centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('FRONTEND_URL')}/orders/${orderId}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/orders`,
      metadata: { orderId },
    });
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
