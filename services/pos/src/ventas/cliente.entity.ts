import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity({ name: "CLIENTE" })
export class Cliente {
  @PrimaryGeneratedColumn({ name: "CLIENTE_ID" })
  clienteId: number;

  @Column({ name: "NOMBRE", length: 150 })
  nombre: string;

  @Column({ name: "IDENTIFICACION", type: "varchar2", length: 30, nullable: true })
  identificacion: string | null;

  @Column({ name: "TELEFONO", type: "varchar2", length: 30, nullable: true })
  telefono: string | null;

  @Column({ name: "DIRECCION", type: "varchar2", length: 250, nullable: true })
  direccion: string | null;
}