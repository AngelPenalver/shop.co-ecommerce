import OrderAddress from 'src/order-address/entities/order-address.entity';
import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @CreateDateColumn()
  orderDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('text')
  orderStatus: 'pending' | 'processing' | 'delivered' | 'cancelled';

  @Column('text')
  paymentStatus: 'pending' | 'completed' | 'failed';

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('text')
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';

  @Column('text', { nullable: true })
  transactionId: string | null;

  @OneToOne(() => OrderAddress, { cascade: true, eager: true })
  @JoinColumn()
  shippingAddress: OrderAddress;
}
