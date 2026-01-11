import { ModuleClientOnly as Module } from "@/shared";
import { PageProps, EmptyObject } from "@/lib/definitions";
import { Metadata } from "next";
import { getClub } from '@/lib/actions';
//import { ClubCard, ClubDetailsTabs } from '@/components/club';
import { ClubCard } from "@/components/club/ClubCard";
import { ClubDetailsTabs } from "@/components/club/ClubDetailsTabs";    
//import { MarkdownContent } from '@/components';
import { notFound } from "next/navigation";

type Params = { clubId: string };
type SearchParams = EmptyObject;

// 🎯 EXPORT THIS - Next.js auto-calls it!
export async function generateMetadata({ 
  params 
}: PageProps<Params, SearchParams>): Promise<Metadata> {
  const { clubId } = await params;
  const club = await getClub(clubId);
  
  return {
    title: `${club.name} | Club Details | PickleHub`,
    description: club.description || `View details for ${club.name}`,
  };
}

export default async function ClubLayout({
  children,
  params,
  searchParams
}: PageProps<Params, SearchParams> & { children: React.ReactNode }) {
    const { clubId } = await params;
    

    // Direct backend API call to fetch club data using react cache() option from actions.ts
    // NOTE: getClub also converts the apiData via snakeToCamel
    const club = await getClub(clubId);
    if (!club) {
      notFound();
    }
    console.log("Club Layout - banner image URL: ", club.bannerUrl);
    return (
      <Module type="default">
        <div className='page__content'>
            <div className='club-details'>
                <div className='club-details-topSection'>
                    <ClubCard club={club} actions={true} variant='detail'/> 
                    {/* <MarkdownContent content={club.longDescription || ''} /> */}
                    <div className='flex flex-col mt-md gap-sm'>
                      <h2 className='headline-md text-secondary'>About {club.name}</h2>
                      <p className='body-sm sm:body-md text-on-surface-variant pb-md mb-md border-b border-outline-variant'>
                        {club.description || 'No additional details provided for this club.'}
                      </p>
                    </div>
                    <ClubDetailsTabs clubId={club.id}/>  
                </div>
                <div className='club-details-bottomSection'>
                    {children}
                </div>
            </div>
        </div>
      </Module>
    );
}