import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { templateParts } from "@/lib/demo-data";
import { Plus, Edit, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { TemplatePart } from "@/types";
import { useNavigate } from "react-router-dom";

export default function TemplateParts() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const navigate = useNavigate();

  const filteredParts = roleFilter === "all" 
    ? templateParts 
    : templateParts.filter(part => part.role === roleFilter);

  return (
    <AppShell title="Template Parts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Template Parts</h1>
            <p className="text-muted-foreground mt-1">Reusable onboarding components with fields and validators</p>
          </div>
          <Button>
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
            </SelectContent>
          </Select>
        </div>

        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-center mb-4">
                No parts yet. Generate from a repo scan or create one manually.
              </p>
              <Button>
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
                        <Badge variant="secondary" className="capitalize">{part.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {part.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{part.fields.length}</TableCell>
                      <TableCell>{part.validators.length}</TableCell>
                      <TableCell>{format(new Date(part.updatedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
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
    </AppShell>
  );
}
