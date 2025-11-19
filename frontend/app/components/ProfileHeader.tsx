'use client';

import { useAuth } from "../providers/AuthUserProvider";
import { useRouter } from "next/navigation";
import { usePathname } from 'next/navigation';
import { Avatar, Icon, Dropdown, Button, MenuItem } from "../ui";
import { AvatarUploader } from "../ui/avatar-uploader";

export function ProfileHeader () {

    const { user, refetchUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname(); 

    const showEditAvatar =  
		pathname === '/profile' ||  
		pathname === '/profile/setup' ||
        pathname === '/dashboard/member';  

    // ✅ Step 1: Handle upload (save to backend)
    // Wrap saveAvatar to show user Feedback
    const handleAvatarUpload = async (url: string) => {
        try {
        const response = await fetch("/api/profile/update", {
            method: "PATCH",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            profile_picture_url: url, // Only sending avatar url
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return;
        }
        const data = await response.json();
        await refetchUser();
        } catch (error) {
            console.error("💥 CATCH: Error in handleAvatarUpload:", error);
        }
    };

    // ✅ Step 2: Handle widget close (refresh UI)
    const handleWidgetClose = () => {
        router.refresh();
    };

    const handleDeleteImage = async () => {  
        try {  
            const response = await fetch('/api/profile/update', {  
                method: 'PATCH',  
                headers: { 'Content-Type': 'application/json' },  
                body: JSON.stringify({  
                    profile_picture_url: null // ✅ Sets to NULL in Django!  
                }),  
            });  
        
            if (!response.ok) {  
                throw new Error('Failed to delete avatar');  
            }  
        
            const updatedUser = await response.json();  
            // Update your auth context or local state  
            await refetchUser();
            router.refresh();

        } catch (error) {  
        console.error('Avatar delete failed:', error);  
        // Show error toast  
        }  
    };  

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page__header">
        <Avatar
            size="xl"
            src={user.profilePictureUrl ?? undefined}
            name={`${user.firstName} ${user.lastName}`}
        />
        <div className="flex-1 flex flex-col justify-between h-[64px] sm:h-[96px]">
            <h1 className="title-lg emphasized">
                {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-xs text-on-surface-variant">
                <Icon name="user" className="icon-lg" />
                <span className="body-lg">@{user.username}</span>
            </div>
            <div className="flex items-center gap-xs text-on-surface-variant">
                <Icon name="location" className="icon-lg" />
                <span className="body-lg">St. Jerome</span>
            </div>
        </div>

        {showEditAvatar && (
            <Dropdown
                trigger={
                    <Button
                    variant="outlined"
                    size="md"
                    label="Change Image"
                    icon="edit"
                    />
                }
                align="right"
                hoverEnabled={false}
            >
                <AvatarUploader
                    onUploadSuccess={handleAvatarUpload}
                    onWidgetClose={handleWidgetClose}
                />
                <MenuItem
                    label="Delete image"
                    icon="delete"
                    iconBordered={false}
                    className="text-error"
                    onClick={() => {
                        handleDeleteImage();
                    }}
                />
            </Dropdown>
      )}
    </div>
  );

}