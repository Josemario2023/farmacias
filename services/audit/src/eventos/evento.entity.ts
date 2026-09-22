import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla EVENTO del esquema FRM_AUDIT.
// Aqui aterriza cada evento que audit recibe de RabbitMQ.
@Entity({ name: "EVENTO" })
export class Evento {
  @PrimaryGeneratedColumn({ name: "EVENTO_ID" })
  eventoId: number;

  @Column({ name: "TIPO_EVENTO", length: 60 })
  tipoEvento: string;

  @Column({ name: "SERVICIO_ORIGEN", length: 30 })
  servicioOrigen: string;

  @Column({ name: "AGREGADO_ID", type: "number", nullable: true })
  agregadoId: number | null;

  @Column({ name: "SUCURSAL_ID", type: "number", nullable: true })
  sucursalId: number | null;

  // El payload es el contenido JSON del evento. En Oracle es un CLOB.
  // Lo mapeamos como string; TypeORM maneja la conversion.
  @Column({ name: "PAYLOAD", type: "clob", nullable: true })
  payload: string | null;
}
