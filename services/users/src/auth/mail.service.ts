import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    // Configura el "transportador" que envia correos, apuntando a Mailhog
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("SMTP_HOST"),
      port: Number(this.config.get<string>("SMTP_PORT")),
      secure: false,   // Mailhog no usa TLS
    });
  }

  // Envia el correo con el codigo OTP
  async enviarOtp(destino: string, codigo: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get<string>("SMTP_FROM"),
      to: destino,
      subject: "Tu codigo de verificacion - Farmacias",
      text: `Tu codigo de verificacion es: ${codigo}. Expira en 5 minutos.`,
      html: `<h2>Codigo de verificacion</h2><p>Tu codigo es: <b style="font-size:24px">${codigo}</b></p><p>Expira en 5 minutos.</p>`,
    });
  }
}
