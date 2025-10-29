"use client";

import { useAuth } from "@/app/providers/AuthUserProvider";

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
      <p>PROFILE SETUP PAGE</p>
      <button
        onClick={() => logout()}
        className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600"
      >
        Log Out
      </button>
    </main>
  );
}
