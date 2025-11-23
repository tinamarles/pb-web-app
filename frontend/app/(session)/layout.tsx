// Layout for Login and SignUp page
import { AnimatedBackground } from "../pages/Landing/AnimatedBackground";
import { Module } from "@/app/shared";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Module type="auth">
      <div className="page__content">
        <AnimatedBackground />
        <div className="authForm-wrapper">{children}</div>
        <div className="hidden sm:block"></div>
      </div>
    </Module>
  );
}
