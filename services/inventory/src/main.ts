import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { config } from "dotenv";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";

config({ path: join(__dirname, "..", ".env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();