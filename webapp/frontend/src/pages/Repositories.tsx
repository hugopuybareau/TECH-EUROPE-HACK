import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Play, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

interface RepoResponse {
  id: string;
  company_id: string;
  provider: string;
  org: string;
  name: string;
  default_branch: string;
  created_at: string;
}

interface ScanResponse {
  id: string;
  repo_id: string;
  company_id: string;
  status: "queued" | "running" | "done" | "error";
  summary: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function Repositories() {
  const [selectedRepo, setSelectedRepo] = useState<RepoResponse | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scanningRepos, setScanningRepos] = useState<Map<string, string>>(new Map());
  const [completedScans, setCompletedScans] = useState<Set<string>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Form state for adding repository
  const [newRepo, setNewRepo] = useState({
    provider: "",
    org: "",
    name: "",
    default_branch: "main",
  });

  // Fetch repositories
  const { data: repos = [], isLoading } = useQuery<RepoResponse[]>({
    queryKey: ["repos"],
    queryFn: () => api.get("/api/v1/repos"),
  });

  // Create repository mutation
  const createRepoMutation = useMutation({
    mutationFn: (repoData: typeof newRepo) =>
      api.post<RepoResponse>("/api/v1/repos", repoData),
    onSuccess: () => {
      toast.success("Repository added", {
        description: "Repository has been successfully connected.",
      });
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      setAddModalOpen(false);
      setNewRepo({ provider: "", org: "", name: "", default_branch: "main" });
    },
    onError: (error: Error) => {
      toast.error("Failed to add repository", {
        description: error.message || "Could not connect repository.",
      });
    },
  });

  // Trigger scan mutation
  const scanMutation = useMutation({
    mutationFn: ({ repoId }: { repoId: string }) =>
      api.post<ScanResponse>(`/api/v1/repos/${repoId}/scan`),
    onSuccess: (data, variables) => {
      toast.success("Scan started", {
        description: "Repository scan has been queued and will begin shortly.",
      });

      // Track this scan for polling
      setScanningRepos(prev => new Map(prev).set(variables.repoId, data.id));
    },
    onError: (error: Error) => {
      toast.error("Scan failed", {
        description: error.message || "Failed to start repository scan.",
      });
    },
  });

  // Poll for scan status
  useEffect(() => {
    if (scanningRepos.size === 0) return;

    pollIntervalRef.current = setInterval(async () => {
      const updatedScans = new Map(scanningRepos);
      let hasChanges = false;

      for (const [repoId, scanId] of scanningRepos.entries()) {
        try {
          const scan = await api.get<ScanResponse>(`/api/v1/repos/${repoId}/scans/${scanId}`);

          if (scan.status === "done") {
            // Find repo name for the toast
            const repo = repos.find(r => r.id === repoId);
            const repoName = repo ? `${repo.org}/${repo.name}` : "Repository";

            toast.success("🎉 Scan Complete!", {
              description: `${repoName} has been successfully scanned! New template parts have been generated and are ready to use.`,
              duration: 5000,
            });

            updatedScans.delete(repoId);
            setCompletedScans(prev => new Set(prev).add(repoId));
            hasChanges = true;

            // Clear completed state after 3 seconds
            setTimeout(() => {
              setCompletedScans(prev => {
                const newSet = new Set(prev);
                newSet.delete(repoId);
                return newSet;
              });
            }, 3000);

            // Optionally refresh repos list
            queryClient.invalidateQueries({ queryKey: ["repos"] });
          } else if (scan.status === "error") {
            toast.error("Scan failed", {
              description: "The repository scan encountered an error.",
            });
            updatedScans.delete(repoId);
            hasChanges = true;
          }
        } catch (error) {
          console.error(`Failed to poll scan ${scanId}:`, error);
        }
      }

      if (hasChanges) {
        setScanningRepos(updatedScans);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [scanningRepos, queryClient, repos]);

  const handleScan = (repoId: string) => {
    scanMutation.mutate({ repoId });
  };

  const handleAddRepository = () => {
    if (!newRepo.provider || !newRepo.org || !newRepo.name || !newRepo.default_branch) {
      toast.error("Validation error", {
        description: "Please fill in all required fields.",
      });
      return;
    }
    createRepoMutation.mutate(newRepo);
  };

  const isScanning = (repoId: string) => scanningRepos.has(repoId);
  const isCompleted = (repoId: string) => completedScans.has(repoId);

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

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : repos.length === 0 ? (
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
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repos.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell className="font-medium capitalize">{repo.provider}</TableCell>
                      <TableCell>{repo.org}/{repo.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{repo.default_branch}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(repo.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant={isCompleted(repo.id) ? "default" : "outline"}
                            onClick={() => handleScan(repo.id)}
                            disabled={isScanning(repo.id)}
                            className={
                              isScanning(repo.id)
                                ? "bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                                : isCompleted(repo.id)
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : ""
                            }
                          >
                            {isScanning(repo.id) ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Scanning...
                              </>
                            ) : isCompleted(repo.id) ? (
                              <>
                                ✓ Completed
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Scan Now
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedRepo(repo)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
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
            <SheetTitle>Repository Details</SheetTitle>
            <SheetDescription>
              {selectedRepo?.org}/{selectedRepo?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedRepo && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-sm font-semibold">Provider</Label>
                <p className="text-sm text-muted-foreground capitalize">{selectedRepo.provider}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Organization</Label>
                <p className="text-sm text-muted-foreground">{selectedRepo.org}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Repository</Label>
                <p className="text-sm text-muted-foreground">{selectedRepo.name}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Default Branch</Label>
                <p className="text-sm text-muted-foreground">{selectedRepo.default_branch}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Created At</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedRepo.created_at), "PPpp")}
                </p>
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
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={newRepo.provider}
                onValueChange={(value) => setNewRepo({ ...newRepo, provider: value })}
              >
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
              <Label htmlFor="org">Organization *</Label>
              <Input
                id="org"
                placeholder="myorg"
                value={newRepo.org}
                onChange={(e) => setNewRepo({ ...newRepo, org: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Repository Name *</Label>
              <Input
                id="name"
                placeholder="my-repo"
                value={newRepo.name}
                onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Default Branch *</Label>
              <Input
                id="branch"
                placeholder="main"
                value={newRepo.default_branch}
                onChange={(e) => setNewRepo({ ...newRepo, default_branch: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRepository} disabled={createRepoMutation.isPending}>
              {createRepoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Repository"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
