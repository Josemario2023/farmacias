import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from "typeorm";
import { actorMiddleware, instalarActor } from "./actor/actor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(actorMiddleware);
  instalarActor(app.get(DataSource));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
