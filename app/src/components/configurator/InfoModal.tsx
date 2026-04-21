"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InfoSpec } from "@/data/types";

interface Props {
  title: string;
  spec: InfoSpec;
}

export function InfoModal({ title, spec }: Props) {
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
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-3 pb-2 border-b border-gray-200">{spec.title}</p>
            <ul className="space-y-1 list-disc list-inside">
              {spec.specs.map((item, i) => (
                <li key={i}>
                  {item.label && <span className="font-medium">{item.label}: </span>}
                  {item.value}
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
