import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getColorForText } from "@/lib/colors";
import { Plus, GripVertical, Trash2, Eye } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TemplatePart } from "@/types";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

function SortableStep({ part, onRemove }: { part: TemplatePart; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold">{part.title}</h4>
            <Button size="sm" variant="ghost" onClick={onRemove}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{part.description}</p>
          <div className="flex gap-2">
            <Badge variant="secondary">{part.fields.length} fields</Badge>
            <Badge variant="secondary">{part.validators.length} validators</Badge>
            {part.tags.map((tag) => (
              <Badge key={tag} variant="outline" className={getColorForText(tag)}>{tag}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplateComposer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [templateName, setTemplateName] = useState("New Template");
  const [selectedParts, setSelectedParts] = useState<TemplatePart[]>([]);
  const [roleKey, setRoleKey] = useState<"intern" | "manager" | "cto">("intern");
  const [searchQuery, setSearchQuery] = useState("");
  const qc = useQueryClient();

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

  const mapApiToUi = (part: ApiTemplatePart): TemplatePart => ({
    id: part.id,
    title: part.title,
    description: part.description ?? "",
    role: part.role_key as any,
    tags: part.tags || [],
    fields: part.fields || [],
    validators: part.validators || [],
    updatedAt: part.updated_at,
  });

  const partsQuery = useQuery({
    queryKey: ["template-parts", "all"],
    queryFn: async () => {
      const res = await api.get<ApiTemplatePart[]>(`/api/v1/template-parts`);
      return res.map(mapApiToUi);
    },
  });

  type ApiTemplate = {
    id: string;
    name: string;
    role_key: "intern" | "manager" | "cto";
    part_ids: string[];
    status: "draft" | "published";
    version: number;
    updated_at: string;
  };

  const templateQuery = useQuery({
    queryKey: ["template", id],
    enabled: !!id,
    queryFn: () => api.get<ApiTemplate>(`/api/v1/templates/${id}`),
  });

  useEffect(() => {
    if (templateQuery.data && partsQuery.data) {
      setTemplateName(templateQuery.data.name);
      setRoleKey(templateQuery.data.role_key);
      const partMap = new Map(partsQuery.data.map((p) => [p.id, p]));
      const selected = templateQuery.data.part_ids
        .map((pid) => partMap.get(pid))
        .filter(Boolean) as TemplatePart[];
      setSelectedParts(selected);
    }
  }, [templateQuery.data, partsQuery.data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedParts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addPart = (part: TemplatePart) => {
    if (!selectedParts.find((p) => p.id === part.id)) {
      setSelectedParts([...selectedParts, part]);
    }
  };

  const removePart = (partId: string) => {
    setSelectedParts(selectedParts.filter((p) => p.id !== partId));
  };

  const filteredParts = searchQuery
    ? (partsQuery.data ?? []).filter(
        (part) =>
          part.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : (partsQuery.data ?? []);

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const body = {
        name: templateName,
        role_key: roleKey,
        part_ids: selectedParts.map((p) => p.id),
      };
      let templateId = id as string | undefined;
      if (templateId) {
        await api.patch(`/api/v1/templates/${templateId}`, body);
      } else {
        const res = await api.post<ApiTemplate>("/api/v1/templates", body);
        templateId = res.id;
      }
      if (publish && templateId) {
        await api.post(`/api/v1/templates/${templateId}/publish`);
      }
      return { id: templateId };
    },
    onSuccess: async (_data, publish) => {
      toast.success(publish ? "Template published" : "Draft saved");
      qc.invalidateQueries({ queryKey: ["templates"] });
      navigate("/templates");
    },
    onError: (e: any) => toast.error(e.message || "Failed to save template"),
  });

  return (
    <AppShell title="Template Composer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-2xl font-semibold h-auto py-2 border-0 px-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-40">
              <Select value={roleKey} onValueChange={(v) => setRoleKey(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cto">CTO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => navigate("/questionnaires/preview")}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" disabled={saveMutation.isPending || selectedParts.length === 0 || !templateName} onClick={() => saveMutation.mutate(false)}>Save Draft</Button>
            <Button disabled={saveMutation.isPending || selectedParts.length === 0 || !templateName} onClick={() => saveMutation.mutate(true)} className="bg-green-600 hover:bg-green-700 text-white">Publish Version</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Parts Library</CardTitle>
              <Input
                placeholder="Search parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-3"
              />
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {partsQuery.isLoading && (
                <div className="text-sm text-muted-foreground py-4">Loading parts…</div>
              )}
              {partsQuery.isError && (
                <div className="text-sm text-red-500 py-4">Failed to load parts</div>
              )}
              {filteredParts.map((part) => (
                <div key={part.id} className="border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{part.title}</h4>
                    <Button size="sm" variant="ghost" onClick={() => addPart(part)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {part.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className={`text-xs ${getColorForText(tag)}`}>{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{part.fields.length} fields</span>
                    <span>•</span>
                    <span>{part.validators.length} validators</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Template Steps</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag to reorder • {selectedParts.length} parts selected
              </p>
            </CardHeader>
            <CardContent>
              {selectedParts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted-foreground mb-4">
                    Add parts from the library to build your template
                  </p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={selectedParts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {selectedParts.map((part) => (
                        <SortableStep key={part.id} part={part} onRemove={() => removePart(part.id)} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
