import { AuthShell } from "../signin/page";

export const metadata = {
  title: "Sign up · Orion",
  description: "Create your Orion workspace.",
};

export default function SignupPage() {
  return <AuthShell mode="signup" />;
}
