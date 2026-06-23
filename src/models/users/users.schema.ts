import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {

  @Prop({
    type: String,
    required: [true, 'Name is required'],
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [30, 'Name must be at most 30 characters'],
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,

  })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: Number, min: 0, max: 120 })
  age: number;

  @Prop({ type: String })
  phoneNumber: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: String })
  verificationCode: string;

  @Prop({
    type: String,
    enum: Object.values(UserGender),
  })
  gender: UserGender;

  @Prop({ type: Date })
  passwordChangedAt: Date;

  @Prop({ type: String })
  passwordResetCode: string;

  @Prop({ type: Date })
  passwordResetExpires: Date;

  @Prop({ type: Boolean, default: false })
  passwordResetVerified: boolean;

  @Prop({ type: String })
  googleId: string;

  @Prop({ type: String, select: false })
  refreshToken: string;
  
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});