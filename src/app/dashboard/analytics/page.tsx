import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline tracking-tight">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Shop Analytics</CardTitle>
           <CardDescription>This is where the analytics and reporting interface will be.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-96">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                Not enough data for analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Charts and reports about your shop performance will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
