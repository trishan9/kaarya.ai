import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { AUTH_MESSAGES, LOG_MESSAGES } from 'src/constants/messages.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { ACAuthIdentityRepository } from 'src/repositories/auth-identity.repository';
import {
  OAuthLinkTicket,
  OAuthResultPayload,
  OAuthTransactionState,
} from 'src/types/oauth-flow.type';
import { OAuthProviderProfile } from 'src/types/oauth-profile.type';
import { UserRole } from 'src/types/user-role.enum';
import { UserService } from './user.service';

@Injectable()
export class OAuthAccountService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLoggerService,
    private readonly authIdentityRepository: ACAuthIdentityRepository,
  ) {}

  async resolveOAuthResult(
    tx: OAuthTransactionState,
    profile: OAuthProviderProfile,
    createLinkTicket: (payload: OAuthLinkTicket) => Promise<string>,
  ): Promise<OAuthResultPayload> {
    const existingIdentity =
      await this.authIdentityRepository.findByProviderIdentity(
        profile.provider,
        profile.providerUserId,
      );

    if (existingIdentity) {
      const user = await this.userService.getUserByIdRaw(
        existingIdentity.userId.toString(),
      );

      await this.authIdentityRepository.updateById(existingIdentity.id, {
        email: this.normalizeEmailOrNull(profile.email),
        emailVerified: profile.emailVerified,
        name: profile.name ?? existingIdentity.name,
        photo: profile.photo ?? existingIdentity.photo,
        lastLoginAt: new Date(),
      });

      await this.backfillUserFromOAuthProfile(user.id, profile);

      const accessToken = await this.signAccessToken(
        user.id,
        user.email,
        user.role,
      );

      this.logger.log(
        `${LOG_MESSAGES.OAUTH_LOGIN_SUCCESS} ${user.id}`,
        OAuthAccountService.name,
      );

      return {
        status: 'authenticated',
        user: sanitizeUser(user),
        accessToken,
        isNewUser: false,
      };
    }

    const legacyUser = await this.userService.getUserByProviderSocialId(
      profile.provider,
      profile.providerUserId,
    );

    if (legacyUser) {
      await this.safeCreateOAuthIdentity({
        userId: legacyUser.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: this.normalizeEmailOrNull(profile.email ?? legacyUser.email),
        emailVerified: profile.emailVerified,
        name: profile.name ?? legacyUser.name ?? null,
        photo: profile.photo ?? legacyUser.photo ?? null,
      });

      await this.backfillUserFromOAuthProfile(legacyUser.id, profile);

      const accessToken = await this.signAccessToken(
        legacyUser.id,
        legacyUser.email,
        legacyUser.role,
      );

      this.logger.log(
        `${LOG_MESSAGES.OAUTH_LOGIN_SUCCESS} ${legacyUser.id}`,
        OAuthAccountService.name,
      );

      return {
        status: 'authenticated',
        user: sanitizeUser(legacyUser),
        accessToken,
        isNewUser: false,
      };
    }

    if (tx.intent === 'link' && tx.requestedByUserId) {
      const linkToken = await createLinkTicket({
        userId: tx.requestedByUserId,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
        emailVerified: profile.emailVerified,
        name: profile.name,
        photo: profile.photo,
        createdAt: new Date().toISOString(),
      });

      return {
        status: 'link_required',
        message: AUTH_MESSAGES.OAUTH_LINK_REQUIRED,
        linkToken,
        provider: profile.provider,
        email: profile.email,
      };
    }

    if (!profile.email) {
      return {
        status: 'error',
        code: 'email_missing',
        message: AUTH_MESSAGES.OAUTH_EMAIL_MISSING,
      };
    }

    if (!profile.emailVerified) {
      return {
        status: 'error',
        code: 'email_unverified',
        message: AUTH_MESSAGES.OAUTH_EMAIL_NOT_VERIFIED,
      };
    }

    const normalizedEmail = this.normalizeEmail(profile.email);
    const emailOwner = await this.userService.getUserByEmail(normalizedEmail);

    if (!emailOwner) {
      const newUser = await this.userService.createUser({
        name: profile.name ?? this.deriveNameFromEmail(normalizedEmail),
        email: normalizedEmail,
        provider: profile.provider,
        socialId: profile.providerUserId,
        photo: profile.photo,
      });

      await this.authIdentityRepository.create({
        userId: new Types.ObjectId(newUser.id),
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: normalizedEmail,
        emailVerified: true,
        name: profile.name ?? null,
        photo: profile.photo ?? null,
        lastLoginAt: new Date(),
      });

      const accessToken = await this.signAccessToken(
        newUser.id,
        newUser.email,
        newUser.role,
      );

      this.logger.log(
        `${LOG_MESSAGES.OAUTH_LOGIN_SUCCESS} ${newUser.id}`,
        OAuthAccountService.name,
      );

      return {
        status: 'authenticated',
        user: sanitizeUser(newUser),
        accessToken,
        isNewUser: true,
      };
    }

    await this.safeCreateOAuthIdentity({
      userId: emailOwner.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: normalizedEmail,
      emailVerified: true,
      name: profile.name ?? null,
      photo: profile.photo ?? null,
    });

    await this.backfillUserFromOAuthProfile(emailOwner.id, profile);

    const accessToken = await this.signAccessToken(
      emailOwner.id,
      emailOwner.email,
      emailOwner.role,
    );

    this.logger.log(
      `${LOG_MESSAGES.OAUTH_LOGIN_SUCCESS} ${emailOwner.id}`,
      OAuthAccountService.name,
    );

    return {
      status: 'authenticated',
      user: sanitizeUser(emailOwner),
      accessToken,
      isNewUser: false,
    };
  }

  async completeOAuthLink(userId: string, ticket: OAuthLinkTicket) {
    const currentUser = await this.userService.getUserByIdRaw(userId);

    const existingIdentity =
      await this.authIdentityRepository.findByProviderIdentity(
        ticket.provider,
        ticket.providerUserId,
      );

    if (existingIdentity && existingIdentity.userId.toString() !== userId) {
      return null;
    }

    if (!existingIdentity) {
      await this.authIdentityRepository.create({
        userId: new Types.ObjectId(userId),
        provider: ticket.provider,
        providerUserId: ticket.providerUserId,
        email: this.normalizeEmailOrNull(ticket.email),
        emailVerified: ticket.emailVerified,
        name: ticket.name ?? null,
        photo: ticket.photo ?? null,
        lastLoginAt: new Date(),
      });
    } else {
      await this.authIdentityRepository.updateById(existingIdentity.id, {
        email: this.normalizeEmailOrNull(ticket.email),
        emailVerified: ticket.emailVerified,
        name: ticket.name ?? existingIdentity.name,
        photo: ticket.photo ?? existingIdentity.photo,
        lastLoginAt: new Date(),
      });
    }

    const normalizedTicketEmail = this.normalizeEmailOrNull(ticket.email);
    const shouldUpdateEmail =
      !currentUser.email && normalizedTicketEmail && ticket.emailVerified;

    const updatePayload: {
      email?: string;
      name?: string;
      photo?: string;
      socialId?: string;
    } = {};

    if (shouldUpdateEmail) {
      const owner = await this.userService.getUserByEmail(
        normalizedTicketEmail,
      );
      if (!owner || owner.id === userId) {
        updatePayload.email = normalizedTicketEmail;
      }
    }

    if (!currentUser.name && ticket.name) {
      updatePayload.name = ticket.name;
    }

    if (!currentUser.photo && ticket.photo) {
      updatePayload.photo = ticket.photo;
    }

    if (currentUser.provider === ticket.provider && !currentUser.socialId) {
      updatePayload.socialId = ticket.providerUserId;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.userService.updateUserRaw(userId, updatePayload);
    }

    const refreshedUser = await this.userService.getUserByIdRaw(userId);
    const accessToken = await this.signAccessToken(
      refreshedUser.id,
      refreshedUser.email,
      refreshedUser.role,
    );

    this.logger.log(
      `${LOG_MESSAGES.OAUTH_LINK_COMPLETED} ${refreshedUser.id}`,
      OAuthAccountService.name,
    );

    return {
      user: sanitizeUser(refreshedUser),
      accessToken,
    };
  }

  private async safeCreateOAuthIdentity(payload: {
    userId: string;
    provider: OAuthProviderProfile['provider'];
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
    name?: string | null;
    photo?: string | null;
  }) {
    try {
      await this.authIdentityRepository.create({
        userId: new Types.ObjectId(payload.userId),
        provider: payload.provider,
        providerUserId: payload.providerUserId,
        email: payload.email,
        emailVerified: payload.emailVerified,
        name: payload.name ?? null,
        photo: payload.photo ?? null,
        lastLoginAt: new Date(),
      });
    } catch (error) {
      const isDuplicateError =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;

      if (!isDuplicateError) {
        throw error;
      }
    }
  }

  private async backfillUserFromOAuthProfile(
    userId: string,
    profile: OAuthProviderProfile,
  ) {
    const user = await this.userService.getUserByIdRaw(userId);
    const updatePayload: {
      email?: string;
      name?: string;
      photo?: string;
      socialId?: string;
    } = {};

    const profileEmail = this.normalizeEmailOrNull(profile.email);

    if (!user.email && profileEmail && profile.emailVerified) {
      const emailOwner = await this.userService.getUserByEmail(profileEmail);
      if (!emailOwner || emailOwner.id === user.id) {
        updatePayload.email = profileEmail;
      }
    }

    if (!user.name && profile.name) {
      updatePayload.name = profile.name;
    }

    if (!user.photo && profile.photo) {
      updatePayload.photo = profile.photo;
    }

    if (user.provider === profile.provider && !user.socialId) {
      updatePayload.socialId = profile.providerUserId;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.userService.updateUserRaw(userId, updatePayload);
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeEmailOrNull(email?: string | null) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private deriveNameFromEmail(email: string) {
    const localPart = email.split('@')[0]?.trim();
    if (!localPart) return 'User';

    const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
    return cleaned.length > 0
      ? cleaned
          .split(' ')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : 'User';
  }

  private async signAccessToken(
    userId: string,
    email: string | null,
    role: UserRole,
  ) {
    return await this.jwtService.signAsync({
      sub: userId,
      email: email ?? undefined,
      role,
    });
  }
}
