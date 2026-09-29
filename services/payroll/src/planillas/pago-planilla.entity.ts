import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "PAGO_PLANILLA" })
export class PagoPlanilla {
  @PrimaryGeneratedColumn({ name: "PAGO_PLANILLA_ID" })
  pagoPlanillaId: number;

  @Column({ name: "PLANILLA_ID", type: "number" })
  planillaId: number;

  @Column({ name: "EMPLEADO_ID", type: "number" })
  empleadoId: number;

  @Column({ name: "FECHA_PAGO", type: "date" })
  fechaPago: Date;

  // SALARIO | BONO | OTRO
  @Column({ name: "TIPO", length: 10 })
  tipo: string;

  @Column({ name: "MONTO_PAGADO", type: "number" })
  montoPagado: number;
}