import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ArticleModule } from './modules/article/article.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { ImportModule } from './modules/import/import.module';
import { UserModule } from './modules/user/user.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { PushRecordModule } from './modules/push-record/push-record.module';
import { HealthModule } from './common/health/health.module';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('app.database.host'),
        port: configService.get<number>('app.database.port'),
        username: configService.get<string>('app.database.username'),
        password: configService.get<string>('app.database.password'),
        database: configService.get<string>('app.database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // 管理后台不自动同步表结构，由主项目管理
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ArticleModule,
    IntelligenceModule,
    ImportModule,
    UserModule,
    FeedbackModule,
    PushRecordModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}