import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import {
  VapiGenerateInterviewDTO,
  TVapiGenerateInterviewDTO,
} from 'src/dtos/interviews/interview.dto';
import { InterviewService } from 'src/services/interview.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';

@ApiTags('Interview')
@Controller({
  path: ROUTES.INTERVIEW.BASE,
  version: '1',
})
export class InterviewVapiController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post(ROUTES.INTERVIEW.VAPI_VOICE_CREATE_CONFIG)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get VAPI voice creation config',
    description:
      'Returns VAPI workflow and variable values for starting AI voice-based interview creation call.',
  })
  @HttpCode(HttpStatus.OK)
  async getVoiceCreationConfig(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const data = await this.interviewService.getVoiceCreationConfig(request.user);
      return buildSuccessResponse(
        data,
        INTERVIEW_MESSAGES.VAPI_CREATION_CONFIG_SUCCESS,
      );
    });
  }

  @Get(ROUTES.INTERVIEW.VAPI_GENERATE)
  @ApiOperation({
    summary: 'VAPI generate interview health check',
    description: 'Health check endpoint for VAPI webhook verification.',
  })
  @HttpCode(HttpStatus.OK)
  async vapiGenerateHealth() {
    return asyncHandler(async () => {
      return buildSuccessResponse(
        { ok: true },
        INTERVIEW_MESSAGES.VAPI_GENERATE_SUCCESS,
      );
    });
  }

  @Post(ROUTES.INTERVIEW.VAPI_GENERATE)
  @ApiOperation({
    summary: 'Generate interview from VAPI workflow',
    description:
      'Receives extracted voice workflow payload from VAPI and creates interview with OpenAI-generated questions.',
  })
  @HttpCode(HttpStatus.OK)
  async generateInterviewFromVapi(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() payload: TVapiGenerateInterviewDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = VapiGenerateInterviewDTO.safeParse(payload);
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const webhookSecret = this.interviewService.extractVapiWebhookSecret(
        headers,
      );
      this.interviewService.assertVapiWebhookSecret(webhookSecret);

      const data = await this.interviewService.createInterviewFromVapiWebhook(
        parsedData.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.VAPI_GENERATE_SUCCESS);
    });
  }
}
