import nodemailer from "nodemailer";

type ContactFormData = {
  fullName: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  message: string;
};

// Simple helper to send a JSON response
function json(res: any, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const { fullName, company, phone, email, service, message } = (req.body ??
    {}) as Partial<ContactFormData>;

  if (!fullName || !email) {
    return json(res, 400, { ok: false, error: "Full name and email are required." });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return json(res, 500, {
      ok: false,
      error: "SMTP configuration is missing on the server.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"HapyJo Website" <${smtpUser}>`,
      to: smtpUser,
      replyTo: email,
      subject: `New request from ${fullName} (${service || "General enquiry"})`,
      text: `
Name: ${fullName}
Company: ${company || "-"}
Phone: ${phone || "-"}
Email: ${email}
Service: ${service || "-"}

Message:
${message || "-"}
      `.trim(),
    });

    return json(res, 200, { ok: true });
  } catch (error: any) {
    return json(res, 500, {
      ok: false,
      error: error?.message || "Failed to send email via SMTP.",
    });
  }
}

