import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DATABASE',
      useFactory: (configService: ConfigService) => {
        const connectionString = `postgres://${configService.get('app.database.username')}:${configService.get('app.database.password')}@${configService.get('app.database.host')}:${configService.get('app.database.port')}/${configService.get('app.database.database')}`;

        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        return drizzle(client, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule {}