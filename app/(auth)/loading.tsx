import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-bg-elevated rounded" />
          <div className="h-4 w-48 bg-bg-elevated rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-12 bg-bg-elevated rounded" />
            <div className="h-9 w-full bg-bg-elevated rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-bg-elevated rounded" />
            <div className="h-9 w-full bg-bg-elevated rounded" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-9 w-full bg-bg-elevated rounded" />
        </CardFooter>
      </Card>
    </main>
  );
}
