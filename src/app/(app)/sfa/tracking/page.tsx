import { PageHeader } from "@/components/sfa/page-header";
import { TrackingMap } from "@/components/sfa/tracking-map";

export default function TrackingPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Live Tracking"
        description="Where the field team is right now, from the NBC Labs mobile app. Pick an employee to see the route they took on any day, with each visit pinned where it was logged."
      />
      <TrackingMap />
    </div>
  );
}
