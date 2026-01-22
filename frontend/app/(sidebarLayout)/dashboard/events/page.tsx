import { Metadata } from 'next';
import { EventsPage } from '@/components/dashboard/eventsPage';


export const metadata: Metadata = {  
  title: 'Dashboard Club Events | PickleHub',  
  description: 'View all Events of the Club.',  
}

export default function DashboardEventsPage() {

  return (
        <EventsPage />
  );
}
