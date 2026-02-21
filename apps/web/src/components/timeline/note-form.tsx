"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface NoteFormProps {
  clientId: string;
  onNoteAdded: () => void;
}

export function NoteForm({ clientId, onNoteAdded }: NoteFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Note cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/clients/${clientId}/notes`, {
        content: trimmed,
      });
      setContent("");
      toast.success("Note added");
      onNoteAdded();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add note"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Add a note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={submitting}
        className="min-h-20 resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !content.trim()}
        >
          {submitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send />
          )}
          Add Note
        </Button>
      </div>
    </form>
  );
}
