"use client";
import { 
  UserIcon, 
} from "@heroicons/react/24/outline";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthUserProvider";

export function ShowDashboard() {
  return (
    <Link
      href="#"
      className="flex items-center rounded-lg bg-primary px-4 transition-colors hover:bg-primary/80"
    >
      <span className="block text-on-surface">
        Dashboard
      </span>{" "}
      <UserIcon className="h-5 ml-4 stroke-on-primary" />
    </Link>
  );
}
export function ShowSignUp() {
  return (
    <Link
      href="/signup"
      className="flex items-center rounded-lg bg-primary px-4 transition-colors hover:bg-primary/80"
    >
      <span className="flex-1 rounded-lg px-4 py-2 text-on-primary block">
        Sign Up
      </span>{" "}
      {/*<UserPlusIcon className="lg:hidden h-5 ml-4 stroke-primary-500 hover:stroke-neutral-900" /> */}
    </Link>
  );
}

export function ShowLogin() {
  return (
    <Link
      href="/login"
      className="flex items-center rounded-lg bg-surface border border-outline px-4 transition-colors hover:bg-primary/80"
    >
      <span className="block py-2 px-3 text-on-surface">Sign In</span>
      {/* <LogInIcon className="h-5 md:ml-4 stroke-neutral-800 dark:stroke-neutral-200 hover:stroke-primary-500" /> */}
    </Link>
  );
}
export function ShowLogout() {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => logout()}
      className="flex h-10 items-center justify-between bg-surface text-on-surface rounded-lg hover:bg-primary/80 transition-colors"
    >
      <span className="block text-on-surface">
        Log Out
      </span>{" "}
      <LogOutIcon className="h-5 stroke-on-surface hover:stroke-primary/80" />
    </button>
  );
}
