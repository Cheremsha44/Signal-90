import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false, // для Mailpit; в проде зависит от провайдера (465 = true)
  // auth: { user, pass } - нужно для боевого сервера, Mailpit не требует
});

export const sendVerificationCode = async (email, code) => {
  await transporter.sendMail({
    from: '"Signal-90" <no-reply@signal90.local>',
    to: email,
    subject: 'Код подтверждения Signal-90',
    text: `Ваш код: ${code}. Действует 10 минут.`,
    html: `<p>Ваш код:</p><h2 style="letter-spacing:4px">${code}</h2><p>Действует 10 минут.</p>`,
  });
};
