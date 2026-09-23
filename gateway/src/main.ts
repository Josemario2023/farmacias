import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // CORS con credenciales: permite que el navegador envie/reciba cookies
  app.enableCors({
    origin: ["http://localhost:5173"],   // el frontend
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,                    // <-- CLAVE: permite cookies
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();