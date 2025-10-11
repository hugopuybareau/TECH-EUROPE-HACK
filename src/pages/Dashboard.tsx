import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ProgressBar";
import { Users, Clock, TrendingUp, GitBranch, Plus, UserPlus } from "lucide-react";
import { onboardings, repositories } from "@/lib/demo-data";
import { format } from "date-fns";

export default function Dashboard() {
  const activeOnboardings = onboardings.filter(o => o.status === "active");
  const avgCompletion = Math.round(
    activeOnboardings.reduce((sum, o) => sum + o.progress, 0) / activeOnboardings.length
  );
  const todayCount = 3; // Mock data
  const latestScans = repositories.slice(0, 3);

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
              <div className="text-2xl font-bold">{latestScans.length}</div>
              <p className="text-xs text-muted-foreground">Recent scans completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Latest Onboardings</CardTitle>
              <CardDescription>Recent developer onboarding progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {onboardings.slice(0, 6).map((onboarding) => (
                  <div key={onboarding.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {onboarding.developerAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{onboarding.developerName}</p>
                        <p className="text-sm text-muted-foreground capitalize">{onboarding.role}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={onboarding.progress} className="flex-1" />
                        <span className="text-sm font-medium">{onboarding.progress}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last activity: {format(new Date(onboarding.updatedAt), "MMM d, h:mm a")}
                      </p>
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
                  {latestScans.map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{repo.org}/{repo.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(repo.lastScanTime), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        Done
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
