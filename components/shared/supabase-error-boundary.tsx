"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    const message =
      error.message.includes("fetch") || error.message.includes("network")
        ? "Unable to connect to the server. Please check your internet connection and try again."
        : error.message || "An unexpected error occurred.";

    return { hasError: true, errorMessage: message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <main className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-danger/10">
                <AlertTriangle className="h-6 w-6 text-accent-danger" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>{this.state.errorMessage}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: "" });
                  window.location.reload();
                }}
              >
                Try again
              </Button>
            </CardFooter>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
