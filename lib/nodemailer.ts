import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

let transporter: Transporter | null = null;

function createTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.office365.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: !smtpSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const emailUser = process.env.EMAIL_USER;

  if (!emailUser || !process.env.EMAIL_PASS) {
    console.warn("[EMAIL HIBA] Nincs beállítva az EMAIL_USER vagy EMAIL_PASS környezeti változó!");
    return {
      success: false,
      error: "Hiányzó e-mail konfiguráció",
    };
  }

  try {
    const mailTransporter = createTransporter();

    const mailOptions: SendMailOptions = {
      from: `"Pannon Transfer" <${emailUser}>`,
      to: options.to,
      subject: options.subject,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    if (options.html) {
      mailOptions.html = options.html;
    } else if (options.text) {
      mailOptions.text = options.text;
    }

    const info = await mailTransporter.sendMail(mailOptions);

    console.log(`[EMAIL SIKERES] E-mail elküldve: ${info.messageId}`);
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`[EMAIL] Előzetes URL: ${testUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ismeretlen hiba történt";
    console.error(`[EMAIL HIBA] E-mail küldés sikertelen: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const mailTransporter = createTransporter();
    await mailTransporter.verify();
    console.log("[EMAIL] SMTP kapcsolat sikeresen ellenőrizve.");
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ismeretlen hiba történt";
    console.error(
      `[EMAIL HIBA] SMTP kapcsolat ellenőrzése sikertelen: ${errorMessage}`
    );
    return false;
  }
}
