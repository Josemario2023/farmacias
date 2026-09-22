import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { OtpCodigo } from "./otp-codigo.entity";

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCodigo)
    private readonly otpRepo: Repository<OtpCodigo>,
  ) {}

  // Genera un codigo de 6 digitos, lo guarda con 5 min de vida, y lo devuelve
  async generar(usuarioId: number): Promise<string> {
    // Numero aleatorio de 6 digitos (100000 a 999999)
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Expira en 5 minutos desde ahora
    const expiraEn = new Date(Date.now() + 5 * 60 * 1000);

    const otp = this.otpRepo.create({
      usuarioId,
      codigo,
      expiraEn,
      usado: 0,
    });
    await this.otpRepo.save(otp);

    return codigo;
  }

  // Valida el codigo: debe existir, no estar usado, no haber expirado
  async validar(usuarioId: number, codigo: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: {
        usuarioId,
        codigo,
        usado: 0,
        expiraEn: MoreThan(new Date()),   // que no haya expirado
      },
      order: { otpId: "DESC" },   // el mas reciente
    });

    if (!otp) {
      return false;   // no existe, o expiro, o ya se uso
    }

    // Marcar como usado (un OTP sirve UNA sola vez)
    otp.usado = 1;
    await this.otpRepo.save(otp);

    return true;
  }
}
