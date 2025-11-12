// Layout for Login and SignUp page
import { AnimatedBackground } from "../pages/Landing/AnimatedBackground";
import { Module } from "@/app/shared";
export default function Layout({ children }: {children:React.ReactNode}) {
    return (
        <Module type='auth'>
            {/*
            <div className="m-0 
                    p-0 
                    min-h-screen
                    flex"
            >
            */}
            <div className="flex">
                {/*
                <div className="hidden sm:block 
                    sm:flex-1 
                    bg-[url('/images/landing03.jpg')]
                    bg-cover 
                    bg-center" 
                >
                
                </div> 
                */}
                <div className="w-full sm:min-w-md md:max-w-xl
                    p-4
                    sm:flex-1 
                    flex flex-col justify-between gap-lg 
                   "
                >
                    {children}
                </div>
                <div className="hidden sm:block sm:flex-1">
                    <AnimatedBackground />
                </div>
                
            </div>
        </Module>
    );
}