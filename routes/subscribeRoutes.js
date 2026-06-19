const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { Subscriber } = require('../models');

// Build transporter from env vars
const buildTransporter = () => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_PORT || '465', 10);

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

// Send welcome email to subscriber
const sendWelcomeEmail = async (email) => {
  const transporter = buildTransporter();
  if (!transporter) {
    console.warn('Mail not configured — skipping welcome email. Set MAIL_USER and MAIL_PASS in .env');
    return;
  }

  const from = process.env.MAIL_FROM || `"BEMS Books" <${process.env.MAIL_USER}>`;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Welcome to the BEMS Books reader list 📚',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#fbfaf7;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbfaf7;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e4e1da;max-width:600px;width:100%;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#13272f 0%,#243c43 56%,#88e04b 100%);padding:32px 40px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:rgba(255,255,255,0.14);border-radius:8px;color:#fff;font-size:18px;font-weight:800;height:46px;text-align:center;width:46px;line-height:46px;">BB</td>
                      <td style="color:#fff;font-size:22px;font-weight:800;padding-left:14px;">BEMS Books</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <h1 style="color:#13272f;font-size:28px;font-weight:800;margin:0 0 16px;">You're on the list. 📖</h1>
                  <p style="color:#66767b;font-size:16px;line-height:1.75;margin:0 0 24px;">
                    Thanks for joining the BEMS Books reader list. You'll get curated reading picks,
                    new ebook drops, study resources, and catalog updates — straight to your inbox.
                  </p>
                  <p style="color:#66767b;font-size:16px;line-height:1.75;margin:0 0 32px;">
                    In the meantime, browse the full catalog and find your next read.
                  </p>
                  <a href="${process.env.SITE_URL || 'http://localhost:3010'}/collections/all.html"
                    style="background:#13272f;border-radius:4px;color:#fff;display:inline-block;font-size:15px;font-weight:700;padding:14px 28px;text-decoration:none;">
                    Browse the catalog →
                  </a>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="border-top:1px solid #e4e1da;color:#66767b;font-size:13px;padding:20px 40px;text-align:center;">
                  © ${new Date().getFullYear()} BEMS Books. Premium ebooks for curious readers.
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
    text: `Welcome to BEMS Books!\n\nYou're on the reader list. You'll receive curated ebook picks, new drops, and catalog updates.\n\nBrowse the catalog: ${process.env.SITE_URL || 'http://localhost:3010'}/collections/all.html\n\n© ${new Date().getFullYear()} BEMS Books`,
  });
};

// POST /api/subscribe
router.post('/', async (req, res) => {
  console.log('HIT /api/subscribe POST', req.body);
  const rawEmail = (req.body.email || '').toString().trim().toLowerCase();

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const [subscriber, created] = await Subscriber.findOrCreate({
      where: { email: rawEmail },
      defaults: {
        email: rawEmail,
        confirmed: false,
        source: req.body.source || 'homepage',
      },
    });

    if (!created) {
      return res.status(200).json({
        message: "You're already on the BEMS Books reader list!",
        alreadySubscribed: true,
      });
    }

    // Send welcome email in background — don't block the response
    sendWelcomeEmail(rawEmail).catch((err) =>
      console.error('Welcome email failed:', err.message)
    );

    return res.status(201).json({
      message: 'You\'re on the list! Check your inbox for a welcome email from BEMS Books.',
      alreadySubscribed: false,
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/subscribe/count  (admin info — how many subscribers)
router.get('/count', async (req, res) => {
  try {
    const count = await Subscriber.count();
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch subscriber count.' });
  }
});

module.exports = router;
