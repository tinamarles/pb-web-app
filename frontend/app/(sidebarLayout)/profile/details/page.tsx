import { ProfileForm } from "@/components/ProfileForm";
import { Metadata } from 'next'

export const metadata: Metadata = {  
  title: 'Profile Details | PickleHub',  
  description: 'Manage your profile, memberships, and account settings.',  
}
export default function ProfilePage() {
  return <ProfileForm mode="view" />;
}
