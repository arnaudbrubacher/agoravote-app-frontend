# Contact Form Email Setup

The contact form in the Agora Vote application is configured to send emails to the specified recipient when users submit the form. This document provides instructions on how to set up and configure the email functionality.

## Configuration

Email settings are configured through environment variables in the `.env` file:

```
# Email Configuration for Contact Form
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=password

# Recipient email address
CONTACT_EMAIL=arnaud_brubacher@hotmail.com
```

## Setting Up with a Real Email Provider

For production use, you should replace the placeholder values with actual SMTP server details from an email service provider. Here are some common options:

### Gmail

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-account@gmail.com
SMTP_PASS=your-app-password
```

Note: For Gmail, you'll need to use an "App Password" rather than your regular account password. You can generate one in your Google Account settings under Security > App passwords.

### SendGrid

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## Development Mode

In development mode, emails are not actually sent but are logged to the console. This behavior is controlled by the `NODE_ENV` environment variable:

```javascript
// In server/api/contact.post.ts
if (process.env.NODE_ENV === 'production') {
  await transporter.sendMail(mailOptions)
} else {
  console.log('Email would be sent in production:')
  console.log(mailOptions)
}
```

## Testing the Contact Form

1. Configure the `.env` file with your SMTP settings
2. Start the application in development mode: `npm run dev`
3. Navigate to the contact form on the landing page
4. Fill out the form and submit
5. Check the console logs to see the email content in development mode
6. In production mode, the email will be sent to the specified recipient

## Troubleshooting

If emails are not being sent:

1. Check that your SMTP credentials are correct
2. Verify that your email service provider allows SMTP access
3. Check for any firewall or network restrictions
4. Look for error messages in the server logs
5. Try a different email service provider if problems persist 