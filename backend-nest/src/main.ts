import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 解决 Express 默认 1mb 限制问题，文件上传最大 5MB
  app.useBodyParser("json", { limit: "5mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "5mb" });

  // 配置静态文件服务 - 用于访问上传的图片
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 启用 CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:5175",
      "http://localhost:5180",
    ],
    credentials: true,
  });

  // 全局前缀
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 星瞰 Admin Backend running on: http://localhost:${port}/api`);
}
void bootstrap();
