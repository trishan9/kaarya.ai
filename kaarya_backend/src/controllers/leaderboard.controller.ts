import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { LEADERBOARD_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import {
  LeaderboardQueryDTO,
  TLeaderboardQueryDTO,
} from 'src/dtos/colleges/college.dto';
import { LeaderboardService } from 'src/services/leaderboard.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';

@ApiTags('Leaderboard')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.LEADERBOARD.BASE,
  version: '1',
})
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get leaderboard data',
  })
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TLeaderboardQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = LeaderboardQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.leaderboardService.getLeaderboard(
        request.user,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, LEADERBOARD_MESSAGES.FETCH_SUCCESS);
    });
  }
}
