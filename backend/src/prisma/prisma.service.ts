import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

neonConfig.webSocketConstructor = WebSocket;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    const hostname = new URL(connectionString).hostname
      .replace(/^\[|\]$/g, '')
      .toLowerCase();
    const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(hostname);

    super({
      adapter: isLocalDatabase
        ? new PrismaPg({ connectionString })
        : new PrismaNeon({ connectionString }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
