import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/StatusPill";
import { templates, templateParts } from "@/lib/demo-data";
import { Plus, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Templates() {
  const navigate = useNavigate();

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.role]) {
      acc[template.role] = [];
    }
    acc[template.role].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <AppShell title="Templates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Onboarding Templates</h1>
            <p className="text-muted-foreground mt-1">Compose templates from reusable parts</p>
          </div>
          <Button onClick={() => navigate("/templates/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-center mb-4">
                Build your first onboarding template by assembling parts.
              </p>
              <Button onClick={() => navigate("/templates/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTemplates).map(([role, roleTemplates]) => (
              <div key={role}>
                <h2 className="text-xl font-semibold mb-4 capitalize">{role} Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roleTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <StatusPill status={template.status} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">v{template.version}</Badge>
                          <Badge variant="secondary">{template.steps.length} parts</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Last updated: {format(new Date(template.updatedAt), "MMM d, yyyy")}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/templates/${template.id}/edit`)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="flex-1" onClick={() => navigate(`/questionnaires/preview?templateId=${template.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
