"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";

import { CredentialsDialog, type AppAccessRow } from "@/components/sfa/app-access-table";
import { Button } from "@/components/ui/button";

export function EmployeeAppCredentials({ row }: { row: AppAccessRow }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <KeyRound />
        {row.hasPassword ? "Reset password" : "Set up app login"}
      </Button>
      <CredentialsDialog row={open ? row : null} onOpenChange={setOpen} />
    </>
  );
}
