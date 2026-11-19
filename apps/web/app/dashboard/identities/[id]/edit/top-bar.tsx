"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteLibrary, renameLibrary } from "../../actions";

/** Isolated editor top bar: back link on the left, renamable identity name on the right. */
export function EditorTopBar({
  libraryId,
  initialName,
}: {
  libraryId: string;
  initialName: string;
}) {
  const [name, setName] = React.useState(initialName);
  const [draft, setDraft] = React.useState(initialName);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const startEditing = () => {
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    const result = await renameLibrary(libraryId, trimmed);
    setSaving(false);
    if (result.ok) {
      setName(result.name);
      setEditing(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b-(length:--border-width) border-border px-3 py-2 sm:flex-nowrap">
      <Button variant="ghost" size="sm" asChild className="shrink-0">
        <Link href="/dashboard">
          <ArrowLeft aria-hidden /> Dashboard
        </Link>
      </Button>
      {editing ? (
        <form onSubmit={save} className="flex min-w-0 items-center gap-1">
          {error ? (
            <span className="max-w-48 truncate text-xs text-destructive" title={error}>
              {error}
            </span>
          ) : null}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
            }}
            aria-label="Identity name"
            autoFocus
            maxLength={80}
            spellCheck={false}
            controlSize="sm"
            className="w-full max-w-48"
          />
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            disabled={saving || !draft.trim()}
            aria-label="Save identity name"
          >
            <Check aria-hidden />
          </Button>
        </form>
      ) : (
        <div className="flex min-w-0 items-center gap-1">
          {error ? (
            <span className="max-w-48 truncate text-xs text-destructive" title={error}>
              {error}
            </span>
          ) : null}
          <span className="max-w-[40vw] truncate text-sm font-medium">{name}</span>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={startEditing}
            aria-label="Rename identity"
          >
            <Pencil aria-hidden />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                disabled={deleting}
                aria-label="Delete identity"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 aria-hidden />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this identity?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{name}&rdquo; and its published versions will be permanently deleted. This
                  can&rsquo;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting}
                  onClick={async () => {
                    if (deleting) return;
                    setDeleting(true);
                    setError(null);
                    const result = await deleteLibrary(libraryId);
                    if (result.ok) {
                      router.push("/dashboard");
                    } else {
                      setDeleting(false);
                      setError(result.message);
                    }
                  }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
