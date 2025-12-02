// Layout for Login and SignUp page
import { AnimatedBackground } from "@/page-components/Landing/AnimatedBackground";
import { Module } from "@/shared";
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
