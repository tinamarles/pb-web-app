'use client';

import { CLUB_TAB_ITEMS } from "@/data";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface ClubDetailsTabsProps {
  clubId: number;
}

export function ClubDetailsTabs({ clubId }: ClubDetailsTabsProps) {
  const pathname = usePathname();

  return (
    <div className='tab-container'>
        <nav>
            {CLUB_TAB_ITEMS.map((tab) => {
                const href = tab.href!.replace('[clubId]', String(clubId));
                const isActive = pathname === href;

                return (
                    <Link 
                        key={href} 
                        href={href}
                        className={`tab-item ${isActive ? 'active' : ''}`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    </div>
  );
}