import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "./modules/auth/auth.module";
import { ArticleModule } from "./modules/article/article.module";
import { IntelligenceModule } from "./modules/intelligence/intelligence.module";
import { ImportModule } from "./modules/import/import.module";
import { UserModule } from "./modules/user/user.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { PushRecordModule } from "./modules/push-record/push-record.module";
import { UploadModule } from "./modules/upload/upload.module";
import { QuizModule } from "./modules/quiz/quiz.module";
import { SatelliteSyncModule } from "./modules/satellite-sync/satellite-sync.module";
import { MilestoneModule } from "./modules/milestone/milestone.module";
import { CompanyModule } from "./modules/company/company.module";
import { MembershipModule } from "./modules/membership/membership.module";
import { HealthModule } from "./common/health/health.module";
import { AllExceptionsFilter } from "./common/filters";
import { TransformInterceptor } from "./common/interceptors";
import { DatabaseModule } from "./database/database.module";
import appConfig from "./config/app.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ArticleModule,
    IntelligenceModule,
    ImportModule,
    UserModule,
    FeedbackModule,
    PushRecordModule,
    UploadModule,
    QuizModule,
    SatelliteSyncModule,
    MilestoneModule,
    CompanyModule,
    MembershipModule,
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
