import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface CompanyResponse {
  id: string;
  name: string;
  domain: string;
  default_role?: string | null;
  created_at: string;
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);

  // User settings local state
  const [fullName, setFullName] = useState(user?.name || "");
  const [repoId, setRepoId] = useState<string>("");

  // Org settings local state
  const [orgName, setOrgName] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [defaultRole, setDefaultRole] = useState("");

  useEffect(() => {
    if (user?.name) setFullName(user.name);
    if (user?.working_repo_id) setRepoId(user.working_repo_id);
  }, [user?.name, user?.working_repo_id]);

  const { data: repos = [] } = useQuery<RepoResponse[]>({
    queryKey: ["repos"],
    queryFn: () => api.get("/api/v1/repos"),
  });

  // Load current company
  const { data: company } = useQuery<CompanyResponse | null>({
    queryKey: ["company", "current"],
    queryFn: () => api.get("/api/v1/companies/current"),
  });

  useEffect(() => {
    if (company) {
      setOrgName(company.name);
      setOrgDomain(company.domain);
      setDefaultRole(company.default_role || "Dev");
    }
  }, [company]);

  const selectedRepoLabel = useMemo(() => {
    const r = repos.find((x) => x.id === repoId);
    return r ? `${r.org}/${r.name}` : undefined;
  }, [repoId, repos]);

  // Match navbar emoji selection
  const emojiChoices = ["🙂", "😎", "🦊", "🐼", "🧠", "🚀", "🌟", "🍀", "🦄", "🐙"];
  const pickEmoji = (seed: string) => {
    if (!seed) return "🙂";
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return emojiChoices[hash % emojiChoices.length];
  };

  const updateMe = useMutation({
    mutationFn: () =>
      api.patch("/api/v1/auth/me", {
        name: fullName,
        working_repo_id: repoId || null,
      }),
    onSuccess: async () => {
      await refreshUser();
      toast.success("Saved", {
        description:
          selectedRepoLabel
            ? `Updated profile and repo (${selectedRepoLabel}).`
            : "Updated profile.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to save", { description: error.message });
    },
  });

  const updateCompany = useMutation({
    mutationFn: () =>
      api.patch("/api/v1/companies/current", {
        name: orgName,
        domain: orgDomain,
        default_role: defaultRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "current"] });
      toast.success("Organization saved", {
        description: `${orgName} (${orgDomain}) updated.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to save organization", { description: error.message });
    },
  });

  return (
    <AppShell title="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage organization settings and API keys</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Organization settings */}
          <div className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-domain">Domain</Label>
                <Input id="org-domain" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-role">Default Role</Label>
                <select
                  id="default-role"
                  className="w-full p-2 border border-border rounded-lg bg-background"
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                >
                  <option value="Intern">Intern</option>
                  <option value="Manager">Manager</option>
                  <option value="CTO">CTO</option>
                  <option value="Dev">Dev</option>
                </select>
              </div>
              <Button onClick={() => updateCompany.mutate()} disabled={updateCompany.isPending}>
                {updateCompany.isPending ? "Saving..." : "Save Organization"}
              </Button>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>Data Region</CardTitle>
              <CardDescription>Location where your data is stored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">US East (Virginia)</Badge>
                <span className="text-sm text-muted-foreground">Read-only</span>
              </div>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for programmatic access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Production Key</p>
                    <code className="text-sm text-muted-foreground">
                      {showKey ? "sk_live_1234567890abcdef" : "••••••••••••••••"}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Development Key</p>
                    <code className="text-sm text-muted-foreground">••••••••••••••••</code>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create New Key
              </Button>
            </CardContent>
            </Card>
          </div>

          {/* Right: User settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>Personal preferences for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{pickEmoji(user?.id || "")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="repo">Working Repository</Label>
                      <Select value={repoId} onValueChange={setRepoId}>
                        <SelectTrigger id="repo">
                          <SelectValue placeholder="Select repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {repos.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.org}/{r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Button onClick={() => updateMe.mutate()} disabled={updateMe.isPending}>
                        {updateMe.isPending ? "Saving..." : "Save User Settings"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
