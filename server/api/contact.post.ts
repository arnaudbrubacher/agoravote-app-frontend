import { defineEventHandler, readBody } from 'h3'
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  try {
    // Get form data from request body
    const body = await readBody(event)
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return {
        success: false,
        message: 'Name, email, and message are required'
      }
    }

    // Create a nodemailer transporter
    // Note: In production, you should use a proper email service like SendGrid, Mailgun, etc.
    // This is a simple example using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    })

    // Email content
    const mailOptions = {
      from: `"Agora Vote Contact Form" <${process.env.SMTP_USER || 'noreply@agoravote.com'}>`,
      to: process.env.CONTACT_EMAIL || 'arnaud_brubacher@hotmail.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        
        Message:
        ${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `
    }

    // Send email
    // In development, we'll just log the email content instead of actually sending it
    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail(mailOptions)
    } else {
      console.log('Email would be sent in production:')
      console.log(mailOptions)
    }

    return {
      success: true,
      message: 'Message sent successfully'
    }
  } catch (error) {
    console.error('Error sending email:', error)
    
    return {
      success: false,
      message: 'Failed to send message'
    }
  }
}) 