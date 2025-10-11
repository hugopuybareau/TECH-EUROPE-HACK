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
import { onboardings } from "@/lib/demo-data";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Onboardings() {
  const navigate = useNavigate();

  return (
    <AppShell title="Onboardings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Onboardings</h1>
            <p className="text-muted-foreground mt-1">Track developer onboarding progress</p>
          </div>
        </div>

        {onboardings.length === 0 ? (
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
                              {onboarding.developerAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{onboarding.developerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{onboarding.role}</Badge>
                      </TableCell>
                      <TableCell>v{onboarding.templateVersion}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <ProgressBar value={onboarding.progress} className="flex-1" />
                          <span className="text-sm font-medium">{onboarding.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(onboarding.startedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(onboarding.updatedAt), "MMM d, h:mm a")}</TableCell>
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
