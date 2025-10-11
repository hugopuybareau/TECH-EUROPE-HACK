import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock } from "lucide-react";
import type { TemplatePart } from "@/types";

type ApiTemplate = {
  id: string;
  name: string;
  role_key: "intern" | "manager" | "cto";
  part_ids: string[];
  status: "draft" | "published";
  version: number;
  updated_at: string;
};

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

const mapApiPartToUi = (part: ApiTemplatePart): TemplatePart => ({
  id: part.id,
  title: part.title,
  description: part.description ?? "",
  role: part.role_key as any,
  tags: part.tags || [],
  fields: part.fields || [],
  validators: part.validators || [],
  updatedAt: part.updated_at,
});

export default function QuestionnairePreview() {
  const [searchParams] = useSearchParams();
  const location = useLocation() as { state?: any };
  const navigate = useNavigate();
  const from = location.state?.from as string | undefined;
  const draft = location.state?.draft as
    | { name: string; role_key: "intern" | "manager" | "cto"; parts: TemplatePart[] }
    | undefined;

  const templateId = searchParams.get("templateId");

  const templateQuery = useQuery({
    queryKey: ["template", templateId],
    enabled: !!templateId && !draft,
    queryFn: () => api.get<ApiTemplate>(`/api/v1/templates/${templateId}`),
  });

  const partsQuery = useQuery({
    queryKey: ["template-parts", "all"],
    enabled: !!templateId && !draft,
    queryFn: async () => {
      const res = await api.get<ApiTemplatePart[]>(`/api/v1/template-parts`);
      return res.map(mapApiPartToUi);
    },
  });

  const templateStepParts: TemplatePart[] = draft
    ? draft.parts || []
    : (() => {
        if (!templateQuery.data || !partsQuery.data) return [] as TemplatePart[];
        const partMap = new Map(partsQuery.data.map((p) => [p.id, p]));
        return (templateQuery.data.part_ids || [])
          .map((pid) => partMap.get(pid))
          .filter(Boolean) as TemplatePart[];
      })();

  const totalFields = templateStepParts.reduce((sum, part) => sum + (part.fields?.length || 0), 0);
  const estimatedTime = Math.ceil(totalFields * 2.5); // 2.5 minutes per field

  const headerTitle = draft
    ? `${draft.name} Questionnaire Preview`
    : templateQuery.data
    ? `${templateQuery.data.name} Questionnaire Preview`
    : "Questionnaire Preview";

  return (
    <AppShell title={headerTitle}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{headerTitle}</h1>
            <p className="text-muted-foreground mt-1">Preview how this template will be presented to developers</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (draft) {
                navigate(`/templates/new`, { state: { draft } });
              } else if (templateId) {
                if (from === "composer") {
                  navigate(`/templates/${templateId}/edit`);
                } else {
                  navigate(`/templates`);
                }
              } else {
                navigate("/templates");
              }
            }}
          >
            Quit Preview
          </Button>
        </div>

        {draft ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {templateStepParts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No parts selected yet. Go back and add parts.
                  </CardContent>
                </Card>
              ) : (
                templateStepParts.map((part, stepIndex) => (
                  <Card key={part.id}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {stepIndex + 1}
                        </div>
                        <div>
                          <CardTitle>{part.title}</CardTitle>
                          <CardDescription className="mt-1">{part.description}</CardDescription>
                          <div className="flex gap-2 mt-2">
                            {part.tags.map((tag) => (
                              <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {part.fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea id={field.id} placeholder={`Enter ${field.label.toLowerCase()}`} disabled />
                          ) : field.type === "select" ? (
                            <select id={field.id} className="w-full p-2 border border-border rounded-lg" disabled>
                              <option>Select an option</option>
                              {field.options?.map((option: string) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id={field.id}
                              type={field.type === "secret" ? "password" : "text"}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              disabled
                            />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Steps</span>
                    <span className="font-medium">{templateStepParts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Fields</span>
                    <span className="font-medium">{totalFields}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estimated time: {estimatedTime} minutes</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Missing Required Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">All required fields are included in this template.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : !templateId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a template to preview.
            </CardContent>
          </Card>
        ) : templateQuery.isLoading || partsQuery.isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : templateQuery.isError || partsQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center text-red-500">Failed to load preview</CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {templateStepParts.map((part, stepIndex) => (
              <Card key={part.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {stepIndex + 1}
                    </div>
                    <div>
                      <CardTitle>{part.title}</CardTitle>
                      <CardDescription className="mt-1">{part.description}</CardDescription>
                      <div className="flex gap-2 mt-2">
                        {part.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {part.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={field.id}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          disabled
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={field.id}
                          className="w-full p-2 border border-border rounded-lg"
                          disabled
                        >
                          <option>Select an option</option>
                          {field.options?.map((option: string) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={field.id}
                          type={field.type === "secret" ? "password" : "text"}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          disabled
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Steps</span>
                  <span className="font-medium">{templateStepParts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Fields</span>
                  <span className="font-medium">{totalFields}</span>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Estimated time: {estimatedTime} minutes
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missing Required Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All required fields are included in this template.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </AppShell>
  );
}
