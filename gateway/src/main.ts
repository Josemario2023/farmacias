import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: permite que el frontend (otro origen) hable con el Gateway
  app.enableCors({
    origin: ["http://localhost:5173"], // el origen del frontend React (Vite) que haremos en Fase 11
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();