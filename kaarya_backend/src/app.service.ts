import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Worldsss!';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'kaarya-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
