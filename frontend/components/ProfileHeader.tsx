"use client";

import { useAuth } from "@/providers/AuthUserProvider";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, Icon, Dropdown, Button, MenuItem } from "@/ui";
import { AvatarUploader } from "@/ui/avatar-uploader";

export function ProfileHeader() {
  const { user, refetchUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState(false);

  const showEditAvatar =
    pathname === "/profile/details" || pathname === "/profile/setup";

  // Effect to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // Mobile breakpoint: < 640px
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ✅ Step 1: Handle upload (save to backend)
  // Wrap saveAvatar to show user Feedback
  const handleAvatarUpload = async (url: string) => {
    console.log("Saving avatar...");
    console.log("current User: ", user);
    console.log("avatar url passed:", url);
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
        console.log("Error Uploading Avatar: ", errorData);
        return;
      }
      // const data = await response.json();
      await response.json();
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
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_picture_url: null, // ✅ Sets to NULL in Django!
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete avatar");
      }

      // const updatedUser = await response.json();
      await response.json();
      // Update your auth context or local state
      await refetchUser();
      router.refresh();
    } catch (error) {
      console.error("Avatar delete failed:", error);
      // Show error toast
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page__header">
      <Avatar
        size="xl"
        src={user.profilePictureUrl ?? undefined}
        name={`${user.firstName} ${user.lastName}`}
      />
      <div className="flex-1 flex flex-col justify-between h-[64px] sm:h-[96px]">
        <h1 className="title-md sm:title-lg emphasized">
          {user.firstName} {user.lastName}
        </h1>
        <div className="flex items-center gap-xs text-on-surface-variant">
          <Icon name="profile" className="icon-md sm:icon-lg" />
          <span className="body-sm sm:body-lg">@{user.username}</span>
        </div>
        <div className="flex items-center gap-xs text-on-surface-variant">
          <Icon name="location" className="icon-md sm:icon-lg" />
          <span className="body-sm sm:body-lg">{user.location}</span>
        </div>
      </div>

      {showEditAvatar && (
        <Dropdown
          trigger={
            isMobile ? (
              <Icon name="picture" size="lg" bordered className='text-primary' />
            ) : (
              <Button
                variant="outlined"
                size="md"
                label="Change Image"
                icon="edit"
              />
            )
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
