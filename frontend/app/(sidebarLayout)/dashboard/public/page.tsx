import { Metadata } from 'next'

export const metadata: Metadata = {  
  title: 'Public Dashboard | PickleHub',  
  description: 'View our features, join a club and more,',  
}

export default function PublicDashboardPage() {
 
  return (
    <div>
      <h2 className="title-lg">PUBLIC DASHBOARD</h2>  
    </div>
  );
}
