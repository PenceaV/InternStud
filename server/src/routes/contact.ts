import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config();

const router = express.Router();

// Validare pentru formularul de contact
const validateContactForm = [
  body('name').trim().notEmpty().withMessage('Numele este obligatoriu'),
  body('email').isEmail().withMessage('Adresa de email nu este validă'),
  body('message').trim().notEmpty().withMessage('Mesajul este obligatoriu'),
];

// Configurare Nodemailer cu SMTP Hostico
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false pentru portul 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // necesar pentru unele servere shared (precum Hostico)
  },
});

// Verificare conexiune SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('Eroare SMTP:', error);
  } else {
    console.log('Conexiune SMTP validă. Gata de trimitere.');
  }
});

router.post('/contact', validateContactForm, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, message, to } = req.body;

  const recipients = to
  ? Array.isArray(to) ? to : [to]
  : [process.env.EMAIL_USER, process.env.EMAIL_USER1];

  const mailOptions = {
    from: `"InternStud Contact" <${process.env.EMAIL_USER}>`,
    to: recipients,
    subject: `Mesaj nou de la ${name}`,
    text: `
      Nume: ${name}
      Email: ${email}

      Mesaj:
      ${message}
    `,
    html: `
      <h3>Mesaj nou de la formularul de contact</h3>
      <p><strong>Nume:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mesaj:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email trimis cu succes' });
  } catch (error) {
    console.error('Eroare la trimiterea email-ului:', error);
    res.status(500).json({ error: 'Eroare la trimiterea email-ului' });
  }
});

export default router;
