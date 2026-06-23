import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [OrdersModule],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
