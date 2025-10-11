import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const timeData = [
  { role: "Intern", median: 4.5 },
  { role: "Manager", median: 6.2 },
  { role: "CTO", median: 2.8 },
];

const failureData = [
  { role: "Intern", rate: 15 },
  { role: "Manager", rate: 8 },
  { role: "CTO", rate: 5 },
];

const slowSteps = [
  { step: "Repository Clone", avgDuration: "45 min", occurrences: 12 },
  { step: "Environment Secrets", avgDuration: "38 min", occurrences: 18 },
  { step: "CLI Tools Installation", avgDuration: "32 min", occurrences: 24 },
  { step: "Jira Project Access", avgDuration: "28 min", occurrences: 9 },
  { step: "IDE Setup", avgDuration: "22 min", occurrences: 31 },
];

export default function Analytics() {
  return (
    <AppShell title="Analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Onboarding performance insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Median Time to Onboard by Role</CardTitle>
              <CardDescription>Average completion time in days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="median" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Failure Rate by Role</CardTitle>
              <CardDescription>Percentage of failed steps</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rate" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Slowest Steps</CardTitle>
            <CardDescription>Steps taking the longest time to complete</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step Name</TableHead>
                  <TableHead>Avg Duration</TableHead>
                  <TableHead>Occurrences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowSteps.map((step) => (
                  <TableRow key={step.step}>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell>{step.avgDuration}</TableCell>
                    <TableCell>{step.occurrences}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
