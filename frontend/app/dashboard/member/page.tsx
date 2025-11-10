"use client";

import { useAuth } from "@/app/providers/AuthUserProvider";
import { isMemberUser } from "@/app/lib/definitions";
import Link from "next/link";

export default function MemberDashboardPage() {
  const { user, logout } = useAuth();

  // Handle case if user is not authenticated
  if (!user) {
    return <div>Please log in!</div>;
  }

  // use type guard to safely access the data
  // eg. const firstClubMembershipLevel = isMemberUser(user)
  //          ? user.clubMemberships?.[0]?.levels?.[0]?.level : null;

  return (
    <main>
      <h1>Welcome, {user.firstName || user.username}</h1>
      <p>MEMBER DASHBOARD</p>

      <Link href="/testavatar">
        <p>Avatar test</p>
      </Link>

      <button
        onClick={() => logout()}
        className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600"
      >
        Log Out
      </button>
    </main>
  );
}
