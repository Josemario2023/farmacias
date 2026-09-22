import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";

@Controller()
export class EventsController {
  // Se ejecuta cuando llega un mensaje con el patron "test.ping"
  @EventPattern("test.ping")
  handleTestPing(@Payload() data: any) {
    console.log("========================================");
    console.log(">>> inventory RECIBIO un evento test.ping:");
    console.log(data);
    console.log("========================================");
  }
}
