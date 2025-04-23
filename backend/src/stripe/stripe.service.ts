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
