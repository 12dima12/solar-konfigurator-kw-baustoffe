"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  html: string;
}

export function InfoModal({ title, html }: Props) {
  const [open, setOpen] = useState(false);

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
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
