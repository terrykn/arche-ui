import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Live mini-render of an identity's tokens (gallery cards, dashboard cards). */
export function MiniRender({
  vars,
  mode = "light",
  children,
}: {
  vars: Record<string, string>;
  mode?: "light" | "dark";
  children?: React.ReactNode;
}) {
  return (
    <div className={mode === "dark" ? "dark" : ""}>
      <div style={vars as React.CSSProperties} className="rounded-lg bg-background p-4 text-foreground">
        <div className="flex items-center gap-2">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="ghost">
            Discard
          </Button>
          <Badge>Pro</Badge>
        </div>
        <Card className="mt-3">
          <CardContent className="pt-4">
            <p className="font-display text-2xl">48,201</p>
            <p className="text-xs text-muted-foreground">Monthly active users</p>
          </CardContent>
        </Card>
        {children}
      </div>
    </div>
  );
}
