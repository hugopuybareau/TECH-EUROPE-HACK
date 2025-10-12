import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/StatusPill";
import { Users, Clock, TrendingUp, GitBranch, Plus, UserPlus } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ApiOnboarding {
  id: string;
  status: "active" | "completed" | "paused";
  progress: number;
  created_at: string;
  updated_at: string;
}

interface RecentOnboardingItem {
  id: string;
  status: "active" | "completed" | "paused";
  progress: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  role_key: string;
  template_version: number;
}

interface RecentScanItem {
  id: string;
  status: "queued" | "running" | "done" | "error";
  created_at: string;
  updated_at: string;
  repo: {
    id: string;
    provider: string;
    org: string;
    name: string;
    default_branch: string;
  };
}

export default function Dashboard() {
  const { data: onboardings = [] } = useQuery<ApiOnboarding[]>({
    queryKey: ["onboardings"],
    queryFn: () => api.get("/api/v1/onboardings"),
  });

  const { data: recentScans = [] } = useQuery<RecentScanItem[]>({
    queryKey: ["recent-scans", 3],
    queryFn: () => api.get(`/api/v1/repos/scans/recent?limit=3`),
  });

  const { data: recentOnboardings = [] } = useQuery<RecentOnboardingItem[]>({
    queryKey: ["recent-onboardings", 6],
    queryFn: () => api.get(`/api/v1/onboardings/recent?limit=6`),
  });

  const activeOnboardings = onboardings.filter(o => o.status === "active");
  const avgCompletion = activeOnboardings.length
    ? Math.round(activeOnboardings.reduce((sum, o) => sum + o.progress, 0) / activeOnboardings.length)
    : 0;
  const todayCount = onboardings.filter(o => isSameDay(new Date(o.updated_at), new Date())).length;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Onboardings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOnboardings.length}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCompletion}%</div>
              <p className="text-xs text-muted-foreground">Across active onboardings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">Active developers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Repo Scans</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentScans.length}</div>
              <p className="text-xs text-muted-foreground">Recent scans completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Latest Onboardings</CardTitle>
              <CardDescription>Recent onboarding progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOnboardings.map((o) => (
                  <div key={o.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    <div className="flex items-center gap-3 md:col-span-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {o.user_name
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{o.user_name}</div>
                        <div className="text-xs text-muted-foreground">v{o.template_version}</div>
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <Badge variant="secondary" className="capitalize">{o.role_key}</Badge>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3">
                        <ProgressBar value={o.progress} className="flex-1" />
                        <span className="text-sm font-medium">{o.progress}%</span>
                      </div>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <StatusPill status={o.status} />
                    </div>
                    <div className="md:col-span-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div>Started: {format(new Date(o.created_at), "MMM d, yyyy")}</div>
                      <div className="text-right">Updated: {format(new Date(o.updated_at), "MMM d, h:mm a")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Onboarding Template
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Developers
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>Latest repository scans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentScans.length > 0 ? (
                    recentScans.map((s) => {
                      const statusClass =
                        s.status === "done"
                          ? "bg-primary text-primary-foreground"
                          : s.status === "error"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-accent text-accent-foreground";
                      return (
                        <div key={s.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{s.repo.org}/{s.repo.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(s.updated_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
                            {s.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No scans yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
