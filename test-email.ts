import { sendInvitationEmail } from './lib/email.js';

// We need to load dotenv first
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function run() {
  console.log("RESEND_API_KEY", process.env.RESEND_API_KEY ? "exists" : "missing");
  
  const res = await sendInvitationEmail({
    to: "test@example.com", // use dummy email, just to see what Resend API returns
    role: "AUTHOR",
    inviteUrl: "http://localhost:3000/invite/123"
  });
  
  console.log("Result:", res);
}

run();
