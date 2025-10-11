import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { repositories } from "@/lib/demo-data";
import { Plus, Play, Eye } from "lucide-react";
import { format } from "date-fns";
import { Repository } from "@/types";

export default function Repositories() {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <AppShell title="Repositories">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Repositories</h1>
            <p className="text-muted-foreground mt-1">Manage connected repositories and scan for artifacts</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Repository
          </Button>
        </div>

        {repositories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-center mb-4">
                Add a repository and trigger your first scan.
              </p>
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connected Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Default Branch</TableHead>
                    <TableHead>Last Scan Status</TableHead>
                    <TableHead>Last Scan Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repositories.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell className="font-medium">{repo.provider}</TableCell>
                      <TableCell>{repo.org}/{repo.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{repo.defaultBranch}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={repo.lastScanStatus === "done" ? "default" : "secondary"}>
                          {repo.lastScanStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(repo.lastScanTime), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">
                            <Play className="h-3 w-3 mr-1" />
                            Scan Now
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedRepo(repo)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Artifacts
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={!!selectedRepo} onOpenChange={() => setSelectedRepo(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Repository Artifacts</SheetTitle>
            <SheetDescription>
              {selectedRepo?.org}/{selectedRepo?.name}
            </SheetDescription>
          </SheetHeader>
          
          {selectedRepo?.artifacts && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Dependencies</h3>
                <div className="space-y-2">
                  {selectedRepo.artifacts.dependencies.map((dep) => (
                    <Badge key={dep} variant="secondary" className="mr-2">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Makefile Targets</h3>
                <div className="space-y-2">
                  {selectedRepo.artifacts.makefileTargets.map((target) => (
                    <Badge key={target} variant="secondary" className="mr-2">
                      make {target}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Package Managers</h3>
                <div className="space-y-2">
                  {selectedRepo.artifacts.packageManagers.map((pm) => (
                    <Badge key={pm} variant="secondary" className="mr-2">
                      {pm}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repository</DialogTitle>
            <DialogDescription>
              Connect a new repository to enable scanning and artifact detection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="gitlab">GitLab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input id="repo-url" placeholder="https://github.com/org/repo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddModalOpen(false)}>Add Repository</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
