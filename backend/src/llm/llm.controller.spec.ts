import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';

describe('LlmController', () => {
  let controller: LlmController;
  let llmService: jest.Mocked<LlmService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
        {
          provide: LlmService,
          useValue: {
            chat: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(LlmController);
    llmService = module.get(LlmService);
  });

  it('passes multi-turn messages through to the service', async () => {
    llmService.chat.mockResolvedValue('reply' as never);

    const result = await controller.chat({
      messages: [
        { role: 'system', content: 'context' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ],
    });

    expect(llmService.chat).toHaveBeenCalledWith([
      { role: 'system', content: 'context' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
    expect(result).toEqual({ reply: 'reply' });
  });
});
