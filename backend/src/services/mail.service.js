import nodemailer from 'nodemailer'

import { env } from '../config/index.js'

let transporter

const getTransporter = () => {
  if (transporter) {
    return transporter
  }

  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })

    return transporter
  }

  transporter = nodemailer.createTransport({ jsonTransport: true })
  return transporter
}

const sendInvitationEmail = async ({ email, tripTitle, role, inviteUrl }) => {
  const mailTransporter = getTransporter()

  const info = await mailTransporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: `You're invited to collaborate on ${tripTitle}`,
    text: `You have been invited as ${role}. Accept invitation: ${inviteUrl}`,
    html: `<p>You have been invited as <strong>${role}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  })

  if (env.nodeEnv !== 'production') {
    console.log('Invitation email payload:', info.message)
  }

  return info
}

export { sendInvitationEmail }
