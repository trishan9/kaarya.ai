import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { asyncHandler } from 'src/common/utils/async-handler';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { ROUTES } from 'src/constants/routes.constants';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { StreamService } from 'src/services/stream.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Stream')
@Controller({
  path: ROUTES.STREAM.BASE,
  version: '1',
})
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @ApiBearerAuth('access-token')
  @Post(ROUTES.STREAM.CHAT_TOKEN)
  @UseGuards(AuthGuard('jwt'))
  async createChatToken(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const user = request.user;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const token = this.streamService.createChatToken(user.id);
      return buildSuccessResponse(
        {
          token,
          apiKey: this.streamService.getChatApiKey(),
        },
        'Stream Chat token created',
      );
    });
  }

  @ApiBearerAuth('access-token')
  @Post(ROUTES.STREAM.VIDEO_TOKEN)
  @UseGuards(AuthGuard('jwt'))
  async createVideoToken(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const user = request.user;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const token = this.streamService.createVideoToken(user.id);
      return buildSuccessResponse(
        {
          token,
          apiKey: this.streamService.getVideoApiKey(),
        },
        'Stream Video token created',
      );
    });
  }

  @ApiBearerAuth('access-token')
  @Post(ROUTES.STREAM.ENSURE_CHANNELS)
  @UseGuards(AuthGuard('jwt'))
  async ensureChannels(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const user = request.user;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      await this.streamService.ensureChannelsForUser(user);
      return buildSuccessResponse(null, 'Channels ensured');
    });
  }

  @ApiBearerAuth('access-token')
  @Post(ROUTES.STREAM.ENSURE_CHANNEL_WITH)
  @UseGuards(AuthGuard('jwt'))
  async ensureChannelWith(
    @Request() request: { user: TAuthenticatedUser },
    @Body() body: { targetUserId?: string; jobId?: string },
  ) {
    return asyncHandler(async () => {
      const user = request.user;
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId.trim() : null;
      const jobId = typeof body?.jobId === 'string' ? body.jobId.trim() || null : null;
      if (!targetUserId) {
        throw new Error('targetUserId is required');
      }
      await this.streamService.ensureChannelWithUser(user, targetUserId, jobId);
      return buildSuccessResponse(null, 'Channel ensured');
    });
  }

  @ApiBearerAuth('access-token')
  @Get(ROUTES.STREAM.CONFIG)
  @UseGuards(AuthGuard('jwt'))
  async getConfig() {
    return asyncHandler(async () => {
      const config = {
        chatEnabled: this.streamService.isChatConfigured(),
        videoEnabled: this.streamService.isVideoConfigured(),
        chatApiKey: this.streamService.getChatApiKey(),
        videoApiKey: this.streamService.getVideoApiKey(),
      };
      return buildSuccessResponse(config, 'Stream config retrieved');
    });
  }
}
