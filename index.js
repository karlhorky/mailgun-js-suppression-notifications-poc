#!/usr/bin/env node

const mailgun = require('mailgun.js');

const [, , apiKey, domain, isEU = false] = process.argv;

const mg = mailgun.client({
  username: 'api',
  key: apiKey,
  ...(isEU ? { url: 'https://api.eu.mailgun.net' } : {})
});

mg.suppressions
  .list(domain, 'bounces')
  .then(({ items }) => {
    if (items.length < 1) return;

    const message = items.reduce(
      ({ text, html }, { created_at, code, address, error }) => ({
        text: `${text}${created_at} [${code}] ${address}: ${error}\n\n`,
        html: `${html}
          <tr>
            <td style="font-size: 18px">
              Address: ${address}<br>
            </td>
          </tr>
          <tr>
            <td>
              <b>Bounced at:</b> ${created_at}<br><br>
              <b>Code:</b> ${code}<br><br>
              <b>Error:</b><br><br>${error}<br><br><br><br>
            </td>
          </tr>
        `
      }),
      { text: '', html: '' }
    );

    mg.messages.create(domain, {
      from: `Mailgun bounce <noreply@${domain}>`,
      to: [`bounces@${domain}`],
      subject: 'mailgun bounce',
      text: `mailgun bounces\n\n:${message.text}`,
      html: `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html>
          <body>
            <table>
              <tr>
                <td style="font-size: 24px">mailgun bounces</td>
              </tr>
              ${message.html}
            </table>
          </body>
        </html>
      `
    });
  })
  .catch(err => console.log('Error!\n', err));
