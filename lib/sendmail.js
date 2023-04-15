import nodemailer from 'nodemailer'
import { google } from 'googleapis'

const { OAuth2 } = google.auth

const oauth2Client = new OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URL
)

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN
})

export default ({destination, subject, content}) => {
  const accessToken = oauth2Client.getAccessToken()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.OAUTH_EMAIL,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      accessToken
    },
  })

  const mailOption = {
    from: process.env.OAUTH_EMAIL,
    to: destination,
    subject,
    generateTextFromHTML: true,
    html: content,
  }

  return transporter.sendMail(mailOption)
}