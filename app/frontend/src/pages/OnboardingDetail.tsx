import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { ProgressBar } from "@/components/ProgressBar";
import { onboardings, events } from "@/lib/demo-data";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";

export default function OnboardingDetail() {
  const { id } = useParams();
  const onboarding = onboardings.find((o) => o.id === id);

  if (!onboarding) {
    return (
      <AppShell title="Onboarding">
        <div>Onboarding not found</div>
      </AppShell>
    );
  }

  const relevantEvents = events.filter(
    (e) => e.actor === onboarding.developerName
  ).slice(0, 10);

  return (
    <AppShell title="Onboarding Detail">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {onboarding.developerAvatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-semibold">{onboarding.developerName}</h1>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize">{onboarding.role}</Badge>
                    <Badge variant="outline">Template v{onboarding.templateVersion}</Badge>
                  </div>
                </div>
              </div>
              <StatusPill status={onboarding.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{onboarding.progress}%</span>
              </div>
              <ProgressBar value={onboarding.progress} />
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>Started: {format(new Date(onboarding.startedAt), "MMM d, yyyy")}</span>
                <span>Last updated: {format(new Date(onboarding.updatedAt), "MMM d, h:mm a")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboarding.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4 p-4 border border-border rounded-2xl">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{step.title}</h4>
                        <StatusPill status={step.status} />
                      </div>
                      {step.status === "failed" && (
                        <Button size="sm" variant="ghost" className="mt-2">
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Re-run validation
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relevantEvents.map((event) => (
                  <div key={event.id} className="border-l-2 border-primary pl-4">
                    <p className="text-sm font-medium">{event.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
