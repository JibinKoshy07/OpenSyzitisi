import { IoAdapter as NestIoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';

export class CustomIoAdapter extends NestIoAdapter {
  constructor(app: INestApplication) {
    super(app);
  }
}
