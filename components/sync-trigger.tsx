"use client";

import { startTransition, useState } from "react";

export function SyncTrigger({ disabled }: { disabled: boolean }) {
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      setMessage("Starting ClickUp sync...");

      const response = await fetch("/api/admin/sync/clickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      const payload = (await response.json()) as { error?: string; recordsUpserted?: number };

      if (!response.ok) {
        setMessage(payload.error ?? "Sync failed");
        return;
      }

      setMessage(
        payload.recordsUpserted !== undefined
          ? `Sync finished: ${payload.recordsUpserted} tasks upserted`
          : "Sync finished"
      );
    });
  }

  return (
    <div className="sync-trigger">
      <button className="sync-button" disabled={disabled} onClick={handleClick} type="button">
        {disabled ? "Add ClickUp credentials to enable sync" : "Run ClickUp sync"}
      </button>
      {message ? <p className="sync-message">{message}</p> : null}
    </div>
  );
}
