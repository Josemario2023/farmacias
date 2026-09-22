import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "OTP_CODIGO" })
export class OtpCodigo {
  @PrimaryGeneratedColumn({ name: "OTP_ID" })
  otpId: number;

  @Column({ name: "USUARIO_ID", type: "number" })
  usuarioId: number;

  @Column({ name: "CODIGO", length: 6 })
  codigo: string;

  @Column({ name: "EXPIRA_EN", type: "timestamp" })
  expiraEn: Date;

  @Column({ name: "USADO", type: "number", default: 0 })
  usado: number;
}
