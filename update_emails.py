import re

# Update lib/email.ts
with open('lib/email.ts', 'r') as f:
    content = f.read()

invite_new = """        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d10; color: #ffffff; padding: 40px 32px; border-radius: 12px; border: 1px solid #1f2127;">
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #1f2127; padding-bottom: 24px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.05em; margin: 0;">x<span style="color: #f04552;">Sypher</span></h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #ffffff;">You have been granted clearance.</h2>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
            You've been invited to join the xSypher editorial desk as a <strong>${role}</strong>.
          </p>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
            Click the secure link below to authenticate and set up your account. This link will automatically expire in 48 hours for security purposes.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteUrl}" style="background-color: #f04552; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="font-size: 13px; color: #52525b; border-top: 1px solid #1f2127; padding-top: 24px; margin-bottom: 0; text-align: center;">
            If you did not expect this invitation, you can safely ignore this dispatch.
          </p>
        </div>"""

reset_new = """        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d10; color: #ffffff; padding: 40px 32px; border-radius: 12px; border: 1px solid #1f2127;">
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #1f2127; padding-bottom: 24px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.05em; margin: 0;">x<span style="color: #f04552;">Sypher</span></h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #ffffff;">Security Alert: Credential Reset Request.</h2>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
            We received a request to reset the master password for your xSypher account.
          </p>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
            Click the secure button below to establish a new password. This authentication token will expire in exactly 1 hour.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #f04552; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #52525b; border-top: 1px solid #1f2127; padding-top: 24px; margin-bottom: 0; text-align: center;">
            If you did not initiate this password reset protocol, you can safely ignore this email. Your current credentials will remain intact.
          </p>
        </div>"""

content = re.sub(r'<div style="font-family: Arial.*?</p>\s*</div>', invite_new, content, count=1, flags=re.DOTALL)
content = re.sub(r'<div style="font-family: Arial.*?</p>\s*</div>', reset_new, content, count=1, flags=re.DOTALL)

with open('lib/email.ts', 'w') as f:
    f.write(content)

# Update app/actions/newsletter.ts
with open('app/actions/newsletter.ts', 'r') as f:
    content2 = f.read()

welcome_new = """          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d10; color: #ffffff; padding: 40px 32px; border-radius: 12px; border: 1px solid #1f2127;">
            <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #1f2127; padding-bottom: 24px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.05em; margin: 0;">x<span style="color: #f04552;">Sypher</span></h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #ffffff;">Welcome to the xSypher Desk.</h2>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
              You are now part of an exclusive list receiving uncompromising intelligence and technical analysis.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
              We'll keep you informed on our latest publications, security dispatches, and insights directly in your inbox.
            </p>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${SITE_URL}" style="background-color: #f04552; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Read Latest Dispatches</a>
            </div>
            <p style="font-size: 13px; color: #52525b; border-top: 1px solid #1f2127; padding-top: 24px; margin-bottom: 0; text-align: center;">
              To terminate your subscription, <a href="${unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">click here to unsubscribe</a>.
            </p>
          </div>"""

content2 = re.sub(r'<div style="font-family: sans-serif.*?</p>\s*</div>', welcome_new, content2, count=1, flags=re.DOTALL)

with open('app/actions/newsletter.ts', 'w') as f:
    f.write(content2)

print("Done")
