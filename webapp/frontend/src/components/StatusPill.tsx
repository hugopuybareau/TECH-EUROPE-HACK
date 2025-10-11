import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 
  | "draft" | "published" | "connected" | "not_connected" 
  | "passed" | "failed" | "active" | "completed" | "paused" 
  | "pending" | "done" | "not_started" | "in_progress" | "skipped";

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  draft: "bg-orange-300 text-white",
  published: "bg-green-600 text-white",
  connected: "bg-primary text-primary-foreground",
  not_connected: "bg-secondary text-secondary-foreground",
  passed: "bg-orange-300 text-white",
  failed: "bg-destructive text-destructive-foreground",
  active: "bg-primary text-primary-foreground",
  completed: "bg-green-600 text-white",
  paused: "bg-secondary text-secondary-foreground",
  pending: "bg-secondary text-secondary-foreground",
  done: "bg-green-600 text-white",
  not_started: "bg-secondary text-secondary-foreground",
  in_progress: "bg-accent text-accent-foreground",
  skipped: "bg-muted text-muted-foreground",
};

const statusLabels: Record<StatusType, string> = {
  draft: "Draft",
  published: "Published",
  connected: "Connected",
  not_connected: "Not connected",
  passed: "Passed",
  failed: "Failed",
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  pending: "Pending",
  done: "Done",
  not_started: "Not started",
  in_progress: "In progress",
  skipped: "Skipped",
};

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <Badge variant="secondary" className={cn(statusStyles[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}
