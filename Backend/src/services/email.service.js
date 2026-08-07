const nodemailer = require("nodemailer");
const env = require("../config/env");

/**
 * Email service for account notifications (welcome + verification emails).
 *
 * When SMTP credentials are configured the email is sent for real. In local
 * development without SMTP, the email body is logged to the console so the
 * flow can still be exercised end-to-end.
 *
 * Error handling: sendMail failures never crash the request (callers catch
 * and continue), but every failure logs the SMTP endpoint, recipient and
 * subject so a broken mail configuration is easy to diagnose.
 */

let transporter = null;

const getTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
    // One-time connectivity check: catches wrong host/port/auth up front so
    // registration failures are not the only symptom of a bad SMTP config.
    transporter.verify((err) => {
      if (err) {
        console.warn(
          "[email-service] SMTP transport verification failed " +
            `(host=${env.smtpHost}, port=${env.smtpPort}, user=${env.smtpUser}): `,
          err.message || err
        );
      } else {
        console.log(`[email-service] SMTP transport ready (${env.smtpHost}:${env.smtpPort}).`);
      }
    });
  }
  return transporter;
};

// Shared delivery helper: real send when SMTP is configured, console log
// otherwise. Rethrows so callers can decide how loudly to report the failure.
const deliver = async ({ to, subject, html, text }) => {
  const client = getTransporter();
  if (!client) {
    console.log("\n[email-service] SMTP not configured - email logged instead.");
    console.log(`[email-service] To: ${to}`);
    console.log(`[email-service] Subject: ${subject}`);
    console.log(`[email-service] (body preview) ${(html || text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300)}...\n`);
    return { logged: true };
  }

  try {
    await client.sendMail({ from: env.mailFrom, to, subject, html, text });
    return { logged: false };
  } catch (error) {
    console.error(
      "[email-service] sendMail FAILED " +
        `(host=${env.smtpHost}, port=${env.smtpPort}, to=${to}, subject="${subject}"): `,
      error && error.message ? error.message : error,
      env.nodeEnv === "development" ? error : ""
    );
    throw error;
  }
};

// Professional MockGen AI branded welcome template — thanks the candidate for
// registering and points them at the product. Deliberately contains NO
// "verify your email" wording; accounts are active immediately.
const buildWelcomeTemplate = ({ name }) => {
  const displayName = (name || "").trim() || "there";
  const safeName = displayName.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  const dashboardUrl = `${env.frontendUrl}/dashboard`;
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#0f172a;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:28px;font-weight:800;color:#a78bfa;letter-spacing:0.5px;">MockGen&nbsp;AI</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#1e293b;border:1px solid #334155;border-radius:16px;padding:36px 32px;">
                <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;">Welcome to MockGen AI, ${safeName}!</h1>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#cbd5e1;">
                  Thank you for registering with MockGen AI. Your account has been successfully
                  created and is ready to use.
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#cbd5e1;">
                  We are excited to help you prepare for technical interviews. Run realistic AI
                  mock interviews, code live in the workspace, and get honest, evidence-based
                  feedback on every session.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding:8px 0 24px;">
                      <a href="${dashboardUrl}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                        Start Your First Interview
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  Tip: configure your target company, role and difficulty to get questions ranked
                  by how often they appear in real interviews at that company.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:20px;">
                <span style="font-size:11px;color:#475569;">&copy; ${new Date().getFullYear()} MockGen AI &middot; AI Interview Simulator</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

/**
 * Send the registration welcome email. Resolves normally when the message is
 * accepted (or, without SMTP, logged) so registration never fails on mail.
 */
const sendWelcomeEmail = async ({ to, name }) => {
  const subject = "Welcome to MockGen AI!";
  const html = buildWelcomeTemplate({ name });
  return deliver({
    to,
    subject,
    html,
    text: `Welcome to MockGen AI! Thank you for registering. Your account has been successfully created — start your first interview here: ${env.frontendUrl}/dashboard`,
  });
};

// Professional HTML template for the verification email.
const buildVerificationTemplate = ({ name, verifyUrl }) => {
  const displayName = (name || "").trim() || "there";
  const safeName = displayName.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#0f172a;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:28px;font-weight:800;color:#a78bfa;letter-spacing:0.5px;">MockGen&nbsp;AI</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#1e293b;border:1px solid #334155;border-radius:16px;padding:36px 32px;">
                <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;">Welcome to MockGen AI, ${safeName}!</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#cbd5e1;">
                  Your account has been created successfully. To activate it and start
                  practicing realistic AI technical interviews, please confirm your email
                  address by clicking the button below.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding:8px 0 24px;">
                      <a href="${verifyUrl}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                        Verify My Email Address
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.6;color:#7c3aed;word-break:break-all;">${verifyUrl}</p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  This link expires in 24 hours. If you did not create this account, you can
                  safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:20px;">
                <span style="font-size:11px;color:#475569;">&copy; ${new Date().getFullYear()} MockGen AI &middot; AI Interview Simulator</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

/**
 * Send the verification email (used by the explicit "resend verification"
 * flow for legacy unverified accounts). Resolves normally when the message is
 * accepted (or, without SMTP, logged) so the request never fails on mail.
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${env.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Confirm your MockGen AI account";
  const html = buildVerificationTemplate({ name, verifyUrl });

  const result = await deliver({
    to,
    subject,
    html,
    text: `Welcome to MockGen AI! Confirm your email address to activate your account: ${verifyUrl}`,
  });
  return { ...result, verifyUrl };
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  get isSmtpConfigured() {
    return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
  },
};
