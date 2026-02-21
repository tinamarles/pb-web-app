'use client';

import { ADMIN_EVENT_TAB_ITEMS } from "@/data";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AdminEvent } from "@/lib/definitions";

interface AdminEventTabsProps {
  event: AdminEvent;
}

export function AdminEventTabs({ event }: AdminEventTabsProps) {
  const pathname = usePathname();

  return (
    <div className='tab-container'>
        <nav>
            {ADMIN_EVENT_TAB_ITEMS.map((tab) => {
                const href = tab.href!.replace('[eventId]', String(event.id)).replace('[clubId]', String(event.clubInfo.id)); // Replace with actual clubId if needed
                const isActive = pathname === href;
                const isDisabled = (event.isEvent && tab.label.startsWith('Participants')) ? true : false;
                return (
                    <Link 
                        key={href} 
                        href={href}
                        className={`tab-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled-item' : ''}`}
                        aria-disabled={isDisabled}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    </div>
  );
}