// Layout for Login and SignUp page

export default function Layout({ children }: {children:React.ReactNode}) {
    return (
        <div className="m-0 
                p-0 
                min-h-screen
                flex"
        >
            <div className="hidden sm:block 
                sm:flex-1 
                bg-[url('/images/landing03.jpg')]
                bg-cover 
                bg-center" 
            >
            </div>
            <div className="w-full sm:min-w-md md:max-w-xl
                p-4
                sm:flex-1 
                flex flex-col justify-between gap-8 
                bg-gray-100 dark:bg-gray-900 
                text-gray-800 dark:text-gray-100"
            >
                {children}
            </div>
        </div>
    );
}