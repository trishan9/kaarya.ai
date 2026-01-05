import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AuthController } from 'src/controllers/auth.controller';
import { LoggerModule } from 'src/logger/logger.module';
import { AuthService } from 'src/services/auth.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { AllConfigType } from 'src/types/config.type';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    LoggerModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        secret: configService.get(CONFIG_KEYS.AUTH.SECRET, { infer: true }),
        signOptions: {
          expiresIn: configService.get(CONFIG_KEYS.AUTH.EXPIRES, {
            infer: true,
          }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
