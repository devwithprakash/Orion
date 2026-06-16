import { prisma } from "@/lib/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend";
import { corsair } from "./corsair";
import { setupCorsair } from "corsair";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = "Orion <onboarding@resend.dev>";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Reset your password",
        html: `
          <p>Click below to reset your password.</p>
          <a href="${url}">Reset Password</a>
        `,
      });

      console.log(result);
    },

    onPasswordReset: async ({ user }) => {
      console.log(`Password reset for ${user.email}`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Verify your email",
        html: `<a href="${url}">Verify Email</a>`,
      });
    },

    autoSignInAfterVerification: true,
    async afterEmailVerification(user, request) {
      console.log(`📧 Email verified for: ${user.email}`);

      try {
        await setupCorsair(corsair, { tenantId: user.id });

        console.log(`✅ Corsair tenant provisioned successfully`);
        console.log(`   - User ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Ready for Gmail & Calendar connection`);
      } catch (error) {
        console.error(
          `⚠️ Corsair tenant provisioning failed (non-blocking):`,
          error,
        );
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});

export async function getSession(headers: Headers) {
  return auth.api.getSession({
    headers,
  });
}
