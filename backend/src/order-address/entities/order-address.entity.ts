import { Order } from 'src/order/entities/order.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order_addresses') 
export default class OrderAddress {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  first_name: string;

  @Column({ type: 'varchar', length: 50 })
  last_name: string;

  @Column({ type: 'varchar', length: 250 })
  address: string; 

  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  @Column({ type: 'varchar', length: 50 })
  country: string;

  @Column({ type: 'varchar', length: 10 })
  zip_code: string;

  @Column({ type: 'varchar', length: 50 })
  phone_number: string;

  @OneToOne(() => Order, order => order.shippingAddress)
  order: Order;
}