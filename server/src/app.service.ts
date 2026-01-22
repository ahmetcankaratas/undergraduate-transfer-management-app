import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHome() {
    return {
      message: 'Welcome to Undergraduate Transfer Management API',
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  }
}
