import { Metadata } from 'next';
import { SignUpForm } from './SignupForm';

export const metadata: Metadata = {  
  title: 'Sign Up | PickleHub',  
  description: 'Create your account to join pickleball clubs, participate in leagues, and book courts.',  
}
export default function SignupPage() {
    return <SignUpForm />
}