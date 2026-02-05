import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: { getHello: jest.Mock };

  beforeEach(async () => {
    appService = {
      getHello: jest.fn().mockReturnValue('Hello Test!'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    controller = module.get(AppController);
  });

  it('should return the greeting from AppService', () => {
    expect(controller.getHello()).toBe('Hello Test!');
    expect(appService.getHello).toHaveBeenCalledTimes(1);
  });
});
