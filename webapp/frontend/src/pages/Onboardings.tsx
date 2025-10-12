import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/StatusPill";
import { ProgressBar } from "@/components/ProgressBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface EnrichedOnboarding {
  id: string;
  status: "active" | "completed" | "paused";
  progress: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  role_key: string;
  template_version: number;
}

export default function Onboardings() {
  const navigate = useNavigate();
  const { data: onboardings = [], isLoading } = useQuery<EnrichedOnboarding[]>({
    queryKey: ["onboardings", "enriched"],
    queryFn: () => api.get(`/api/v1/onboardings/enriched`),
  });

  return (
    <AppShell title="Onboardings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Onboardings</h1>
            <p className="text-muted-foreground mt-1">Track developer onboarding progress</p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : onboardings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-center mb-4">
                No active onboardings. Invite a developer to start.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Developer</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onboardings.map((onboarding) => (
                    <TableRow 
                      key={onboarding.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/onboardings/${onboarding.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {onboarding.user_name
                                .split(" ")
                                .map((s) => s[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{onboarding.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{onboarding.role_key}</Badge>
                      </TableCell>
                      <TableCell>v{onboarding.template_version}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <ProgressBar value={onboarding.progress} className="flex-1" />
                          <span className="text-sm font-medium">{onboarding.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(onboarding.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(onboarding.updated_at), "MMM d, h:mm a")}</TableCell>
                      <TableCell>
                        <StatusPill status={onboarding.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
