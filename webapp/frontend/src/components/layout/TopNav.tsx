import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function TopNav() {
  const { user } = useAuth();
  const { data: company } = useQuery<{ id: string; name: string } | null>({
    queryKey: ["company", "current"],
    queryFn: () => api.get("/api/v1/companies/current"),
  });

  const emojiChoices = ["🙂", "😎", "🦊", "🐼", "🧠", "🚀", "🌟", "🍀", "🦄", "🐙"];
  const pickEmoji = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return emojiChoices[hash % emojiChoices.length];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center gap-6 px-6">
        <div className="flex items-center gap-3">
          <div className="text-xl font-semibold text-foreground">OnboardHub</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              {company?.name || "Company"}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Company Name</DropdownMenuItem>
            <DropdownMenuItem>Acme Corp</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search bar removed */}

        <div className="ml-auto flex items-center gap-2">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user ? pickEmoji(user.id) : "🙂"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user?.name || "Admin User"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
