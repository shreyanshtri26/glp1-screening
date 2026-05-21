import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsNumber()
  @Transform(({ value }: { value: unknown }) => Number(value))
  step!: number;

  // value can be: number, string, or string[]
  @IsNotEmpty()
  value!: number | string | string[];
}
