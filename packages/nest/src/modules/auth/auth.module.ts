import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from '../../shared/auth/auth.service';
import { JwtService } from '../../shared/auth/jwt.service';
import { UserService } from '../../shared/database/services/user.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RbacGuard } from '../../shared/guards/rbac.guard';
import { User } from '../../shared/database/entities/user.entity';
// import { RefreshToken } from '../../shared/database/entities/refresh-token.entity';

/**
 * Authentication Module
 *
 * Provides authentication services, JWT token management,
 * role-based access control, and user management functionality.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      // RefreshToken, // Uncomment when refresh token entity is needed
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, UserService, JwtAuthGuard, RbacGuard],
  exports: [AuthService, JwtService, UserService, JwtAuthGuard, RbacGuard],
})
export class AuthModule {}
