import { authClient } from "@/lib/auth-client";

export async function signIn(data: { email: string; password: string }) {
  return authClient.signIn.email({
    email: data.email,
    password: data.password,
    callbackURL: "/dashboard/email",
  });
}

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
}) {
  return authClient.signUp.email({
    name: data.name,
    email: data.email,
    password: data.password,
    callbackURL: "/dashboard/email",
  });
}