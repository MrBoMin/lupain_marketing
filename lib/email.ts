import nodemailer from "nodemailer"
import { BRAND_COLOR, BRAND_NAME } from "@/lib/brand"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { error: "Failed to send email" }
  }
}

export function getEnrollmentApprovedEmail(studentName: string, courseName: string) {
  return {
    subject: `🎉 You're enrolled in "${courseName}" - ${BRAND_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111111; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 1px solid #2a2a2a;">
            
            <div style="background: ${BRAND_COLOR}; padding: 32px; text-align: center;">
              <h1 style="color: #0a0a0a; margin: 0; font-size: 24px; font-weight: 700;">${BRAND_NAME}</h1>
            </div>
            
            <div style="padding: 40px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                <h2 style="color: #f5f5f5; margin: 0 0 8px 0; font-size: 22px;">Enrollment Approved!</h2>
                <p style="color: #999999; margin: 0; font-size: 15px;">Welcome aboard, ${studentName}!</p>
              </div>
              
              <div style="background: #252525; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #333333;">
                <p style="color: #999999; margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Course</p>
                <p style="color: #f5f5f5; margin: 0; font-size: 18px; font-weight: 600;">${courseName}</p>
              </div>
              
              <p style="color: #bbbbbb; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! Your enrollment request has been approved. The course materials are being prepared and will be available soon.
              </p>
              
              <div style="background: #252525; border-left: 4px solid ${BRAND_COLOR}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #cccccc; margin: 0; font-size: 14px;">
                  <strong>📚 Note:</strong> Course content will be uploaded progressively. Stay tuned!
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${SITE_URL}/dashboard" style="display: inline-block; background: ${BRAND_COLOR}; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Go to Dashboard →
                </a>
              </div>
            </div>
            
            <div style="background: #141414; padding: 24px 32px; text-align: center; border-top: 1px solid #2a2a2a;">
              <p style="color: #666666; margin: 0; font-size: 13px;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getEnrollmentRejectedEmail(studentName: string, courseName: string, reason?: string) {
  return {
    subject: `Enrollment Update for "${courseName}" - ${BRAND_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111111; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 1px solid #2a2a2a;">
            
            <div style="background: ${BRAND_COLOR}; padding: 32px; text-align: center;">
              <h1 style="color: #0a0a0a; margin: 0; font-size: 24px; font-weight: 700;">${BRAND_NAME}</h1>
            </div>
            
            <div style="padding: 40px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h2 style="color: #f5f5f5; margin: 0 0 8px 0; font-size: 22px;">Enrollment Update</h2>
                <p style="color: #999999; margin: 0; font-size: 15px;">Hi ${studentName},</p>
              </div>
              
              <div style="background: #252525; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #333333;">
                <p style="color: #999999; margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Course</p>
                <p style="color: #f5f5f5; margin: 0; font-size: 18px; font-weight: 600;">${courseName}</p>
              </div>
              
              <p style="color: #bbbbbb; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Unfortunately, we couldn't approve your enrollment request at this time.
              </p>
              
              ${reason ? `
                <div style="background: #2a1515; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                  <p style="color: #fca5a5; margin: 0; font-size: 14px;">
                    <strong>Reason:</strong> ${reason}
                  </p>
                </div>
              ` : ''}
              
              <p style="color: #bbbbbb; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                If you believe this is an error or have questions, please contact us.
              </p>
              
              <div style="text-align: center;">
                <a href="${SITE_URL}" style="display: inline-block; background: ${BRAND_COLOR}; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Visit ${BRAND_NAME}
                </a>
              </div>
            </div>
            
            <div style="background: #141414; padding: 24px 32px; text-align: center; border-top: 1px solid #2a2a2a;">
              <p style="color: #666666; margin: 0; font-size: 13px;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
