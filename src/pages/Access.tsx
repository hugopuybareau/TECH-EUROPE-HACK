import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { members } from "@/lib/demo-data";
import { UserPlus, Link as LinkIcon, Copy } from "lucide-react";

export default function Access() {
  return (
    <AppShell title="Invites & Access">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Invites & Access</h1>
            <p className="text-muted-foreground mt-1">Manage team members and invitation links</p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invites">Invite Links</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "secondary"}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {member.status === "pending" && (
                              <Button size="sm" variant="outline">
                                Resend
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites">
            <div className="grid gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Role</label>
                      <select className="w-full p-2 border border-border rounded-lg">
                        <option>Developer</option>
                        <option>Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Expiration</label>
                      <select className="w-full p-2 border border-border rounded-lg">
                        <option>7 days</option>
                        <option>30 days</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <Button className="w-full">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Create Invite Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">Developer Invite Link</p>
                        <p className="text-sm text-muted-foreground">Expires in 7 days</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
