import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { events } from "@/lib/demo-data";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = searchQuery
    ? events.filter(
        (event) =>
          event.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  return (
    <AppShell title="Events & Audit">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Events & Audit</h1>
            <p className="text-muted-foreground mt-1">System activity and audit trail</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{event.summary}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{event.actor}</span>
                        <span>•</span>
                        <span className="capitalize">{event.entity}</span>
                        <span>•</span>
                        <span className="capitalize">{event.action}</span>
                      </div>
                    </div>
                    <time className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                      {format(new Date(event.timestamp), "MMM d, h:mm a")}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
