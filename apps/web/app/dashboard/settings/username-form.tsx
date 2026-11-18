"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveSettings } from "./actions";

function UsernameLabel() {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      Username
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="What the username is used for"
              className="text-muted-foreground hover:text-foreground"
            >
              <Info size={14} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Used in /r/&lt;username&gt; and /p/&lt;username&gt; routes.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

// Username is read-only until Edit is clicked, then the same row submits.
export function UsernameForm({ defaultValue }: { defaultValue: string }) {
  const [editing, setEditing] = React.useState(false);

  if (!editing) {
    return (
      <div className="mt-6 flex items-end gap-2">
        <span className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <UsernameLabel />
          <Input defaultValue={defaultValue} disabled />
        </span>
        <Button type="button" onClick={() => setEditing(true)} className="shrink-0">
          Edit
        </Button>
      </div>
    );
  }

  return (
    <form action={saveSettings} className="mt-6 flex items-end gap-2">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <UsernameLabel />
        <Input name="username" defaultValue={defaultValue} autoFocus />
      </label>
      <Button type="submit" className="shrink-0">
        Save
      </Button>
    </form>
  );
}
