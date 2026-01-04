import { Metadata } from 'next';
import { get } from '@/lib/actions';
import { Club, PageProps, EmptyObject } from "@/lib/definitions";
import { ModuleClientOnly as Module } from "@/shared";
import { ClubListClient } from '@/components/club/ClubListClientPage';
import { snakeToCamel } from '@/lib/utils';

export const metadata: Metadata = {  
  title: 'Club List | PickleHub',  
  description: 'View all the clubs available.',  
}
type Params = EmptyObject; // Empty - no params in URL
type SearchParams = { intent?: string};

export default async function ClubListPage({
  searchParams
}: PageProps<Params, SearchParams>) {
 
    // await the searchParams (a Promise) and extract intent
    const resolvedSearchParams = await searchParams;
    const intent = resolvedSearchParams?.intent;

    // 🎯 Determine mode from query param
    const isJoinMode = intent === 'join';

    // ✅ Server Component - fetch data directly and convert snake case to camel case
    const apiData = await get<unknown>('clubs');
    const clubs = snakeToCamel(apiData) as Club[];

    return (
        <Module type='profile'>
            <div className="page__content">
                <ClubListClient
                    clubs={clubs}
                    isJoinMode={isJoinMode}
                />
            </div>
        </Module> 
    );
}
