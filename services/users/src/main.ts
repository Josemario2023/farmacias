import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { DataSource } from "typeorm";
import { actorMiddleware, instalarActor } from "./actor/actor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.use(actorMiddleware);
  instalarActor(app.get(DataSource));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();