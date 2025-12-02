import { ProfileForm } from "@/components/ProfileForm";
import { Metadata } from 'next'

export const metadata: Metadata = {  
  title: 'Profile Setup | PickleHub',  
  description: 'Setup your profile, memberships, and account settings.',  
}
export default function ProfileSetupPage() {
  return <ProfileForm mode="setup" />;
}
