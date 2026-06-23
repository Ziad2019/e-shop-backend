import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { Tax, TaxSchema } from './tax.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// TAX MODULE
// Manages the global tax and shipping price configuration.
//
// Singleton pattern: only ONE Tax document ever exists in DB.
// POST /tax → upsert (create or update)
// GET  /tax → fetch the single config
// DELETE /tax → reset values to 0
//
// UsersModule → provides UserModel for AuthGuard
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tax.name, schema: TaxSchema },
    ]),
    UsersModule,
  ],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService], // export so OrdersService can use tax config
})
export class TaxModule {}