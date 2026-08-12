import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { OsSidebar } from "@/components/os-sidebar";
import { OsTopbar } from "@/components/os-topbar";
import { computeThresholds } from "@/lib/economics";
import { getActiveOffer } from "@/lib/queries";

/**
 * Every view reads the local database and must reflect the current offer, so
 * nothing here is prerendered at build time.
 */
export const dynamic = "force-dynamic";

export default async function OsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const offer = await getActiveOffer();
  const thresholds = offer ? computeThresholds(offer) : null;

  return (
    <SidebarProvider>
      <OsSidebar
        offer={
          offer && thresholds
            ? {
                name: offer.name,
                roasBreakEven: thresholds.roasBreakEven,
                roasMinMargin: thresholds.roasMinMargin,
                roasTarget: thresholds.roasTarget,
              }
            : null
        }
      />
      <SidebarInset className="overflow-hidden">
        <OsTopbar />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
