import nodemailer from 'nodemailer'

import { env } from '../config/index.js'

let transporter

const EMAIL_BRAND = Object.freeze({
  appName: 'Collaborating Trip Planning',
  accent: '#14532d',
  accentSoft: '#ecfdf3',
  text: '#0f172a',
  muted: '#475569',
  border: '#d1d5db',
  panel: '#ffffff',
})

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

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const buildEmailTemplate = ({
  eyebrow = '',
  heading = '',
  intro = '',
  bullets = [],
  primaryCta = null,
  secondaryCta = null,
  closing = '',
  supportLine = '',
}) => {
  const bulletMarkup = Array.isArray(bullets) && bullets.length
    ? `
      <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_BRAND.muted}; line-height: 1.65;">
        ${bullets.map((item) => `<li style="margin: 0 0 10px;">${escapeHtml(item)}</li>`).join('')}
      </ul>
    `
    : ''

  const actionButton = (action, variant = 'primary') => {
    if (!action?.label || !action?.url) {
      return ''
    }

    const isPrimary = variant === 'primary'
    const background = isPrimary ? EMAIL_BRAND.accent : '#ffffff'
    const textColor = isPrimary ? '#ffffff' : EMAIL_BRAND.accent
    const border = isPrimary ? EMAIL_BRAND.accent : EMAIL_BRAND.border

    return `
      <a href="${escapeHtml(action.url)}"
         style="
           display: inline-block;
           margin-right: 12px;
           margin-top: 8px;
           padding: 12px 18px;
           border-radius: 8px;
           text-decoration: none;
           background: ${background};
           color: ${textColor};
           border: 1px solid ${border};
           font-weight: 600;
           font-size: 14px;
         ">
        ${escapeHtml(action.label)}
      </a>
    `
  }

  return `
    <div style="margin: 0; padding: 24px; background: #f8fafc; font-family: 'Montserrat', Arial, sans-serif; color: ${EMAIL_BRAND.text};">
      <div style="max-width: 640px; margin: 0 auto; background: ${EMAIL_BRAND.panel}; border: 1px solid ${EMAIL_BRAND.border}; border-radius: 14px; overflow: hidden;">
        <div style="padding: 20px 24px; background: ${EMAIL_BRAND.accentSoft}; border-bottom: 1px solid ${EMAIL_BRAND.border};">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_BRAND.accent}; font-weight: 700;">
            ${escapeHtml(eyebrow || EMAIL_BRAND.appName)}
          </p>
          <h1 style="margin: 8px 0 0; font-size: 24px; line-height: 1.3; color: ${EMAIL_BRAND.text};">${escapeHtml(heading)}</h1>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: ${EMAIL_BRAND.muted};">${escapeHtml(intro)}</p>
          ${bulletMarkup}
          <div style="margin-top: 18px;">
            ${actionButton(primaryCta, 'primary')}
            ${actionButton(secondaryCta, 'secondary')}
          </div>
          ${closing ? `<p style="margin: 20px 0 0; font-size: 15px; line-height: 1.7; color: ${EMAIL_BRAND.muted};">${escapeHtml(closing)}</p>` : ''}
          ${supportLine ? `<p style="margin: 12px 0 0; font-size: 13px; color: ${EMAIL_BRAND.muted};">${escapeHtml(supportLine)}</p>` : ''}
        </div>
      </div>
      <p style="max-width: 640px; margin: 14px auto 0; font-size: 12px; color: #64748b; line-height: 1.5;">
        ${EMAIL_BRAND.appName} · Automated notification
      </p>
    </div>
  `
}

const buildPlainText = ({ heading, intro, bullets = [], primaryCta = null, secondaryCta = null, closing = '' }) => {
  const bulletText = Array.isArray(bullets) && bullets.length
    ? `\n${bullets.map((item) => `- ${item}`).join('\n')}\n`
    : ''
  const primary = primaryCta?.label && primaryCta?.url ? `\n${primaryCta.label}: ${primaryCta.url}\n` : ''
  const secondary = secondaryCta?.label && secondaryCta?.url ? `\n${secondaryCta.label}: ${secondaryCta.url}\n` : ''

  return `${heading}\n\n${intro}${bulletText}${primary}${secondary}${closing ? `\n${closing}\n` : ''}`
}

const sendEmail = async ({ to, subject, text, html }) => {
  const mailTransporter = getTransporter()

  const info = await mailTransporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html,
  })

  if (env.nodeEnv !== 'production') {
    const debugPayload =
      info?.message ||
      info?.response ||
      info?.messageId ||
      'Email dispatched (provider did not return preview payload)'
    console.log('Email dispatch:', debugPayload)
  }

  return info
}

const sendWelcomeEmail = async ({ email, recipientName = 'Traveler', appUrl = env.frontendBaseUrl }) => {
  const heading = `Welcome to ${EMAIL_BRAND.appName}`
  const intro = `Hi ${recipientName}, your account is ready. Start organizing your first collaborative itinerary and keep everyone aligned from day one.`
  const primaryCta = {
    label: 'Create Your First Trip',
    url: `${appUrl.replace(/\/$/, '')}/trips`,
  }
  const closing = 'We are glad to have you on board.'

  return sendEmail({
    to: email,
    subject: `Welcome to ${EMAIL_BRAND.appName}`,
    text: buildPlainText({ heading, intro, primaryCta, closing }),
    html: buildEmailTemplate({
      eyebrow: 'Welcome',
      heading,
      intro,
      bullets: [
        'Plan days, activities, files, and budgets in one workspace.',
        'Invite collaborators with role-based permissions.',
      ],
      primaryCta,
      closing,
    }),
  })
}

const sendTripCreatedEmail = async ({
  email,
  recipientName = 'Traveler',
  tripTitle,
  tripUrl,
  startDate,
  endDate,
}) => {
  const heading = `Congratulations on your new trip: ${tripTitle}`
  const intro = `Hi ${recipientName}, your trip has been created successfully. Your planning workspace is now ready for itinerary, collaboration, and organization updates.`
  const primaryCta = {
    label: 'Open Trip Workspace',
    url: tripUrl,
  }
  const closing = 'Happy and safe journey.'

  const dateRange = startDate && endDate
    ? `Travel window: ${new Date(startDate).toDateString()} to ${new Date(endDate).toDateString()}`
    : null

  return sendEmail({
    to: email,
    subject: `Trip created: ${tripTitle}`,
    text: buildPlainText({
      heading,
      intro,
      bullets: dateRange ? [dateRange] : [],
      primaryCta,
      closing,
    }),
    html: buildEmailTemplate({
      eyebrow: 'Trip Planning',
      heading,
      intro,
      bullets: [
        dateRange || 'Your itinerary workspace is active and ready.',
        'You can now add days, activities, budgets, and collaborators.',
      ],
      primaryCta,
      closing,
    }),
  })
}

const sendInvitationEmail = async ({
  email,
  tripTitle,
  role,
  inviteUrl,
  inviterName = 'Trip Owner',
}) => {
  const heading = `You are invited to collaborate on "${tripTitle}"`
  const intro = `${inviterName} has invited you to join as ${role}. Access the workspace to contribute to planning, comments, and organization.`
  const primaryCta = {
    label: 'Accept Invitation',
    url: inviteUrl,
  }
  const closing = 'If this invitation was unexpected, you can ignore this email safely.'

  return sendEmail({
    to: email,
    subject: `Invitation: ${tripTitle}`,
    text: buildPlainText({
      heading,
      intro,
      bullets: [`Assigned role: ${role}`],
      primaryCta,
      closing,
    }),
    html: buildEmailTemplate({
      eyebrow: 'Collaboration Invite',
      heading,
      intro,
      bullets: [
        `Assigned role: ${role}`,
        'You can review itinerary, comments, and trip resources once accepted.',
      ],
      primaryCta,
      closing,
    }),
  })
}

const sendCommentUpdateEmail = async ({
  email,
  recipientName = 'Traveler',
  tripTitle,
  actorName = 'A collaborator',
  commentBody,
  commentUrl,
  optOutUrl,
}) => {
  const heading = `New comment update in ${tripTitle}`
  const intro = `Hi ${recipientName}, ${actorName} posted a new comment in your trip workspace.`
  const primaryCta = {
    label: 'Open Comment Thread',
    url: commentUrl,
  }
  const secondaryCta = {
    label: 'Opt Out of Comment Emails',
    url: optOutUrl,
  }
  const closing = 'You can manage your notification preference anytime from collaboration settings.'

  return sendEmail({
    to: email,
    subject: `Comment update: ${tripTitle}`,
    text: buildPlainText({
      heading,
      intro,
      bullets: [commentBody ? `Comment: ${commentBody}` : 'Open the thread to review the latest update.'],
      primaryCta,
      secondaryCta,
      closing,
    }),
    html: buildEmailTemplate({
      eyebrow: 'Comment Notification',
      heading,
      intro,
      bullets: [
        commentBody ? `Latest comment: ${commentBody}` : 'Open the thread to review the latest update.',
      ],
      primaryCta,
      secondaryCta,
      closing,
    }),
  })
}

export {
  sendCommentUpdateEmail,
  sendInvitationEmail,
  sendTripCreatedEmail,
  sendWelcomeEmail,
}
