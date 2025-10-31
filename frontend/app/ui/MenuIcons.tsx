"use client";
import { 
  UserIcon, 
} from "@heroicons/react/24/outline";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthUserProvider";
import { Button } from "./button";

// <Button variant='outlined' size='md' icon='dashboard' label='Outlined Button'/>
/* <Button key={index} asChild variant="subtle" size="md">  
                <Link key={index} href={link.href}>  
                  {link.name}  
                </Link>
              </Button> 
*/
export function ShowDashboard() {
  return (
    <Button asChild variant="subtle" size="md" icon='dashboard'>
      <Link href="#">
          Dashboard
      </Link>
    </Button>
  );
}
export function ShowSignUp() {
  return (
    <Button asChild variant="filled" size="md">
      <Link href="/signup">
          Sign Up
      </Link>
    </Button>
  );
}

export function ShowLogin() {
  return (
    <Button asChild variant="outlined" size="md">
      <Link href="/login">
          Sign In
      </Link>
    </Button>
  );
}
export function ShowLogout() {
  const { logout } = useAuth();
  return (
    <Button variant = "subtle" size="md" icon="signout" label="Log Out"
      onClick={() => logout()}
    />
  );
}
