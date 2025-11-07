import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline tracking-tight">Customers</h1>
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>This is where the customer management interface will be.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-96">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                No customers to show
              </h3>
              <p className="text-sm text-muted-foreground">
                A list of your customers will appear here.
              </p>
              <Button className="mt-4">Add Customer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
