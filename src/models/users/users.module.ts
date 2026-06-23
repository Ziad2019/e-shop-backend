import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController, UserMeController } from './users.controller';
import { User, UserSchema } from './users.schema';

// ============================================================
// USERS MODULE
// A NestJS module bundles related functionality together.
// This module is responsible for everything related to users:
//
//   imports     → external modules/models this module depends on
//   exports     → what other modules can use from this module
//   controllers → handle HTTP requests and return responses
//   providers   → services, repositories, helpers (injectable classes)
// ============================================================
@Module({
  imports: [
    // Register the User model for this module
    // This allows UsersService to inject it via @InjectModel(User.name)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  // Export MongooseModule so other modules (e.g., AuthModule)
  // can also use the UserModel without re-registering it
  exports: [MongooseModule],

  controllers: [
    UsersController,    // handles /users routes     (admin only)
    UserMeController,   // handles /userMe routes    (authenticated user)
  ],

  providers: [UsersService],
})
export class UsersModule {}