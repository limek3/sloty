import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "./button";

export function QrCard(props: { title: string; url: string }) {
  return (
    <div className="glass rounded-3xl p-5 space-y-3">
      <div className="text-sm font-medium">{props.title}</div>

      <div className="flex items-center justify-between gap-4">
        <div className="rounded-2xl p-3" style={{ background: "rgba(127,127,127,0.08)", border: "1px solid var(--border)" }}>
          <QRCodeCanvas value={props.url} size={132} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="muted break-all">{props.url}</div>
          <div className="flex gap-2">
            <Button
              full={false}
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(props.url);
              }}
            >
              Copy
            </Button>
            <Button
              full={false}
              size="sm"
              variant="secondary"
              onClick={async () => {
                if ((navigator as any).share) await (navigator as any).share({ url: props.url, title: "Запись" });
                else await navigator.clipboard.writeText(props.url);
              }}
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}