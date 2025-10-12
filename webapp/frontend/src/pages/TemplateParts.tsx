import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getColorForText } from "@/lib/colors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Select already imported above
import { Plus, Edit, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { TemplatePart } from "@/types";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type ApiTemplatePart = {
  id: string;
  company_id: string;
  title: string;
  description?: string | null;
  role_key: string;
  tags: string[];
  fields: any[];
  validators: any[];
  created_at: string;
  updated_at: string;
};

function mapApiToUi(part: ApiTemplatePart): TemplatePart {
  return {
    id: part.id,
    title: part.title,
    description: part.description ?? "",
    role: part.role_key as TemplatePart["role"],
    tags: part.tags || [],
    // Only counts are displayed in table; keep raw for potential future use
    fields: (part.fields || []) as any,
    validators: (part.validators || []) as any,
    updatedAt: part.updated_at,
  };
}

type FormState = {
  title: string;
  description: string;
  role_key: "intern" | "manager" | "cto" | "dev" | "";
  tagsInput: string; // comma-separated
  fieldsJson: string; // JSON array
  validatorsJson: string; // JSON array
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  role_key: "",
  tagsInput: "",
  fieldsJson: "[]",
  validatorsJson: "[]",
});

function parseJsonArray(input: string): { value: any[] | null; error: string | null } {
  try {
    const parsed = JSON.parse(input || "[]");
    if (!Array.isArray(parsed)) return { value: null, error: "Must be a JSON array" };
    return { value: parsed, error: null };
  } catch (e: any) {
    return { value: null, error: e.message };
  }
}

export default function TemplateParts() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["template-parts", roleFilter],
    queryFn: async () => {
      const query = roleFilter !== "all" ? `?role_key=${roleFilter}` : "";
      const res = await api.get<ApiTemplatePart[]>(`/api/v1/template-parts${query}`);
      return res.map(mapApiToUi);
    },
  });

  const filteredParts = useMemo(() => data ?? [], [data]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activePart, setActivePart] = useState<TemplatePart | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const fieldsState = useMemo(() => parseJsonArray(form.fieldsJson), [form.fieldsJson]);
  const validatorsState = useMemo(() => parseJsonArray(form.validatorsJson), [form.validatorsJson]);

  const resetForm = () => setForm(emptyForm());

  const createMutation = useMutation({
    mutationFn: async () => {
      const tags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const fields = fieldsState.value ?? [];
      const validators = validatorsState.value ?? [];

      return api.post<ApiTemplatePart>("/api/v1/template-parts", {
        title: form.title,
        description: form.description || undefined,
        role_key: form.role_key,
        tags,
        fields,
        validators,
      });
    },
    onSuccess: () => {
      toast.success("Template part created");
      setCreateOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["template-parts"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create"),
  });

  const patchMutation = useMutation({
    mutationFn: async (id: string) => {
      const body: any = {};
      if (form.title) body.title = form.title;
      if (form.description) body.description = form.description;
      if (form.role_key) body.role_key = form.role_key;
      if (form.tagsInput.length >= 0) {
        body.tags = form.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
      if (!fieldsState.error) body.fields = fieldsState.value ?? [];
      if (!validatorsState.error) body.validators = validatorsState.value ?? [];
      return api.patch<ApiTemplatePart | { ok: boolean }>(`/api/v1/template-parts/${id}`, body);
    },
    onSuccess: () => {
      toast.success("Template part updated");
      setEditOpen(false);
      setActivePart(null);
      resetForm();
      qc.invalidateQueries({ queryKey: ["template-parts"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/template-parts/${id}`),
    onSuccess: () => {
      toast.success("Template part deleted");
      qc.invalidateQueries({ queryKey: ["template-parts"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (part: TemplatePart) => {
    setActivePart(part);
    setForm({
      title: part.title,
      description: part.description || "",
      role_key: part.role,
      tagsInput: part.tags.join(", "),
      fieldsJson: JSON.stringify(part.fields ?? [], null, 2),
      validatorsJson: JSON.stringify(part.validators ?? [], null, 2),
    });
    setEditOpen(true);
  };

  return (
    <AppShell title="Template Parts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Template Parts</h1>
            <p className="text-muted-foreground mt-1">Reusable onboarding components with fields and validators</p>
          </div>
          <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Template Part
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="cto">CTO</SelectItem>
              <SelectItem value="dev">Dev</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-red-500">Failed to load template parts</CardContent>
          </Card>
        ) : filteredParts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-center mb-4">
                No parts yet. Generate from a repo scan or create one manually.
              </p>
              <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Template Part
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Validators</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${getColorForText(part.role)}`}>{part.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {part.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className={getColorForText(tag)}>{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{part.fields.length}</TableCell>
                      <TableCell>{part.validators.length}</TableCell>
                      <TableCell>{format(new Date(part.updatedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(part)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setForm({
                                title: `${part.title} (copy)`,
                                description: part.description || "",
                                role_key: part.role,
                                tagsInput: part.tags.join(", "),
                                fieldsJson: JSON.stringify(part.fields ?? [], null, 2),
                                validatorsJson: JSON.stringify(part.validators ?? [], null, 2),
                              });
                              setCreateOpen(true);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(part.id)}>
                            <Trash2 className="h-3 w-3" />
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Template Part</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" className="col-span-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <div className="col-span-3">
                <Select value={form.role_key} onValueChange={(v) => setForm({ ...form, role_key: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cto">CTO</SelectItem>
                    <SelectItem value="dev">Dev</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" className="col-span-3" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">Tags</Label>
              <Input id="tags" placeholder="comma,separated,tags" className="col-span-3" value={form.tagsInput} onChange={(e) => setForm({ ...form, tagsInput: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right">Fields JSON</Label>
              <div className="col-span-3 space-y-2">
                <Textarea rows={6} value={form.fieldsJson} onChange={(e) => setForm({ ...form, fieldsJson: e.target.value })} />
                {fieldsState.error && <p className="text-sm text-red-500">{fieldsState.error}</p>}
                {!fieldsState.error && <p className="text-xs text-muted-foreground">{(fieldsState.value ?? []).length} field(s)</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right">Validators JSON</Label>
              <div className="col-span-3 space-y-2">
                <Textarea rows={6} value={form.validatorsJson} onChange={(e) => setForm({ ...form, validatorsJson: e.target.value })} />
                {validatorsState.error && <p className="text-sm text-red-500">{validatorsState.error}</p>}
                {!validatorsState.error && <p className="text-xs text-muted-foreground">{(validatorsState.value ?? []).length} validator(s)</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.title || !form.role_key || !!fieldsState.error || !!validatorsState.error || createMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drawer */}
      <Drawer open={editOpen} onOpenChange={setEditOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle>Edit Template Part</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title-e" className="text-right">Title</Label>
                <Input id="title-e" className="col-span-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role-e" className="text-right">Role</Label>
                <div className="col-span-3">
                  <Select value={form.role_key} onValueChange={(v) => setForm({ ...form, role_key: v as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="cto">CTO</SelectItem>
                      <SelectItem value="dev">Dev</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description-e" className="text-right">Description</Label>
                <Textarea id="description-e" className="col-span-3" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags-e" className="text-right">Tags</Label>
                <Input id="tags-e" placeholder="comma,separated,tags" className="col-span-3" value={form.tagsInput} onChange={(e) => setForm({ ...form, tagsInput: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right">Fields JSON</Label>
                <div className="col-span-3 space-y-2">
                  <Textarea rows={6} value={form.fieldsJson} onChange={(e) => setForm({ ...form, fieldsJson: e.target.value })} />
                  {fieldsState.error && <p className="text-sm text-red-500">{fieldsState.error}</p>}
                  {!fieldsState.error && <p className="text-xs text-muted-foreground">{(fieldsState.value ?? []).length} field(s)</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right">Validators JSON</Label>
                <div className="col-span-3 space-y-2">
                  <Textarea rows={6} value={form.validatorsJson} onChange={(e) => setForm({ ...form, validatorsJson: e.target.value })} />
                  {validatorsState.error && <p className="text-sm text-red-500">{validatorsState.error}</p>}
                  {!validatorsState.error && <p className="text-xs text-muted-foreground">{(validatorsState.value ?? []).length} validator(s)</p>}
                </div>
              </div>
            </div>
            <DrawerFooter className="flex justify-end">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditOpen(false);
                    setActivePart(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => activePart && patchMutation.mutate(activePart.id)}
                  disabled={!form.title || !form.role_key || !!fieldsState.error || !!validatorsState.error || patchMutation.isLoading}
                >
                  {patchMutation.isLoading ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
}
