import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { config } from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import { actorMiddleware, instalarActor } from "./actor/actor";

config({ path: join(__dirname, "..", ".env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(actorMiddleware);
  instalarActor(app.get(DataSource));
  await app.listen(process.env.PORT ?? 3006);
}
bootstrap();