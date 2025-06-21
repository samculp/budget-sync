import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

function createTransporter() {
  // Log configuration for debugging
  console.log('Email configuration:', {
    host: 'smtp-relay.brevo.com',
    port: 587,
    user: process.env.BREVO_SMTP_USER ? '***configured***' : 'NOT CONFIGURED',
    pass: process.env.BREVO_SMTP_KEY ? '***configured***' : 'NOT CONFIGURED'
  })

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  return transporter
}

// Send invitation email
export const sendInvitationEmail = async (invitedEmail, budgetName, inviterName, customMessage = '') => {
  try {
    console.log('Attempting to send email to:', invitedEmail)
    console.log('Budget name:', budgetName)
    console.log('Inviter name:', inviterName)
    
    const transporter = createTransporter()
    
    // Verify transporter configuration
    await transporter.verify()
    console.log('Transporter verified successfully')
    
    const mailOptions = {
      from: process.env.BREVO_EMAIL,
      to: invitedEmail,
      subject: `You've been invited to collaborate on "${budgetName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Budget Collaboration Invitation</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <p style="color: #495057; font-size: 16px; line-height: 1.6;">
              Hello!
            </p>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to collaborate on the budget: <strong>"${budgetName}"</strong>
            </p>
            
            ${customMessage ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #41DC03;">
              <p style="color: #495057; font-size: 14px; margin: 0; font-style: italic;">
                "${customMessage}"
              </p>
            </div>
            ` : ''}
            
            <p style="color: #495057; font-size: 16px; line-height: 1.6;">
              To accept this invitation and start collaborating, please:
            </p>
            
            <ol style="color: #495057; font-size: 16px; line-height: 1.6;">
              <li>Create an account on our expense tracker platform</li>
              <li>Log in to your account</li>
              <li>You'll see the shared budget in your dashboard</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/signup" 
                 style="background-color:rgb(46, 157, 2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Create Account
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
              If you already have an account, you can log in at: 
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="color:rgb(46, 157, 2);">
                ${process.env.CLIENT_URL || 'http://localhost:5173'}/login
              </a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
              This invitation was sent from Sam at BudgetSync. 
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    }

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    console.log('Email response:', info)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    })
    return { success: false, error: error.message }
  }
}