import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { templates, templateParts } from "@/lib/demo-data";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";

export default function QuestionnairePreview() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId") || "t1";
  const template = templates.find((t) => t.id === templateId);
  
  const templateStepParts = template?.steps.map((step) => 
    templateParts.find((part) => part.id === step.partId)
  ).filter(Boolean);

  const totalFields = templateStepParts?.reduce((sum, part) => sum + (part?.fields.length || 0), 0) || 0;
  const estimatedTime = Math.ceil(totalFields * 2.5); // 2.5 minutes per field

  return (
    <AppShell title="Questionnaire Preview">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Questionnaire Preview</h1>
          <p className="text-muted-foreground mt-1">
            Preview how this template will be presented to developers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {templateStepParts?.map((part, stepIndex) => (
              <Card key={part?.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {stepIndex + 1}
                    </div>
                    <div>
                      <CardTitle>{part?.title}</CardTitle>
                      <CardDescription className="mt-1">{part?.description}</CardDescription>
                      <div className="flex gap-2 mt-2">
                        {part?.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {part?.fields.map((field) => (
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
                          {field.options?.map((option) => (
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
                  <span className="font-medium">{templateStepParts?.length}</span>
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
      </div>
    </AppShell>
  );
}
