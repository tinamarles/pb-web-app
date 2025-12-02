import { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {  
  title: 'Login | PickleHub',  
  description: 'Log in to your PickleHub account to access leagues, matches, and member features.',  
}

export default function LoginPage() {
    return <LoginForm />
}