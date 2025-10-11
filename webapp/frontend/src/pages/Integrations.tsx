import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { integrations } from "@/lib/demo-data";
import { Github, GitlabIcon as Gitlab, Cable } from "lucide-react";
import { Integration } from "@/types";

const iconMap: Record<string, any> = {
  github: Github,
  gitlab: Gitlab,
};

export default function Integrations() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const IconComponent = selectedIntegration ? iconMap[selectedIntegration.icon] || Cable : Cable;

  return (
    <AppShell title="Integrations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Integrations</h1>
            <p className="text-muted-foreground mt-1">Connect external providers to enable scanning and automation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const Icon = iconMap[integration.icon] || Cable;
            return (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    {integration.connected ? (
                      <Badge variant="default">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Not connected</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4">{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  {integration.connected ? (
                    <Button variant="outline" className="w-full" onClick={() => setSelectedIntegration(integration)}>
                      View Details
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => setSelectedIntegration(integration)}>
                      Connect
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <Sheet open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-3 mb-2">
              <IconComponent className="h-6 w-6 text-primary" />
              <SheetTitle>{selectedIntegration?.name}</SheetTitle>
            </div>
            <SheetDescription>{selectedIntegration?.description}</SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {selectedIntegration?.connected ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input id="client-id" value={selectedIntegration.clientId} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input id="client-secret" type="password" value="••••••••••••" readOnly />
                </div>
                {selectedIntegration.scopes && (
                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedIntegration.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary">{scope}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button className="flex-1">Test Connection</Button>
                  <Button variant="destructive" className="flex-1">Disconnect</Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-client-id">Client ID</Label>
                  <Input id="new-client-id" placeholder="Enter client ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-client-secret">Client Secret</Label>
                  <Input id="new-client-secret" type="password" placeholder="Enter client secret" />
                </div>
                <Button className="w-full">Connect Integration</Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
