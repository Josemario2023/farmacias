import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { config } from "dotenv";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";
import { DataSource } from "typeorm";
import { actorMiddleware, instalarActor } from "./actor/actor";

config({ path: join(__dirname, "..", ".env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  app.use(actorMiddleware);
  instalarActor(app.get(DataSource));
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();