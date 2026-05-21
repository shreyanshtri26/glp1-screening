import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { SessionService } from './session.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /** POST /api/session/start — start a new form session */
  @Post('start')
  async start() {
    return this.sessionService.startSession();
  }

  /** POST /api/session/answer — save answer, return next question or final result */
  @Post('answer')
  @HttpCode(200)
  async answer(@Body() dto: SubmitAnswerDto) {
    return this.sessionService.submitAnswer(dto);
  }

  /** GET /api/session/:id — return saved progress */
  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }
}
