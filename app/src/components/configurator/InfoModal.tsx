"use client";
import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Tags and attributes present in catalog.json info fields — nothing else allowed.
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ["h2", "h3", "ul", "ol", "li", "span", "strong", "em", "p", "br"],
  ALLOWED_ATTR: ["class"],
};

interface Props {
  title: string;
  html: string;
}

export function InfoModal({ title, html }: Props) {
  const [open, setOpen] = useState(false);

  // SSG pass runs in Node.js where window/document don't exist — catalog.json
  // is trusted build-time data so falling back to the raw string is safe there.
  // The client hydration always sanitizes before inserting into the DOM.
  const safeHtml = useMemo(() => {
    if (typeof window === "undefined") return html;
    return DOMPurify.sanitize(html, PURIFY_CONFIG);
  }, [html]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="Mehr Informationen"
      >
        <Info className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
