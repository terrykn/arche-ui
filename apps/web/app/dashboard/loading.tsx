import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

/** Designed loading state for dashboard routes: layout-matching skeletons, never a blank void. */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Separator className="my-6" />
      <ul className="grid gap-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
