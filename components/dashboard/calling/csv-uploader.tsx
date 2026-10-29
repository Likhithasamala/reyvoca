"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Action } from "@/components/dashboard/ui/action";
import { downloadCsvTemplate } from "@/lib/calling/csv";
import { cn } from "@/lib/cn";

/**
 * CSV drop zone.
 *
 * The file is read in the browser and never uploaded: a contact list is
 * customer data, and there is no backend that could receive it securely yet.
 *
 * The drop zone is a real <button>, so the whole control is keyboard
 * reachable; the hidden file input carries the accept rules.
 */
export function CsvUploader({
  onFile,
  fileName,
}: {
  onFile: (text: string, name: string) => void;
  fileName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Upload a .csv file. Spreadsheets can be exported as CSV.");
      return;
    }
    if (file.size > 5_000_000) {
      setError("That file is over 5 MB. Split it into smaller lists for now.");
      return;
    }
    setError(undefined);
    onFile(await file.text(), file.name);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent-wash" : "border-line-strong bg-surface hover:bg-surface-muted/50",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink">
          <Upload className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="mt-4 text-sm font-semibold text-ink">
          {fileName ? "Replace contact list" : "Upload CSV"}
        </span>
        <span className="mt-1 text-xs leading-relaxed text-ink-muted">
          Drop a .csv here, or choose a file. Your list stays in this browser.
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Upload contact list as CSV"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          // Clears the input so the same file can be chosen twice.
          event.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {fileName ? (
          <p className="flex min-w-0 items-center gap-2 text-xs text-ink-muted">
            <FileSpreadsheet className="size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate font-medium text-ink">{fileName}</span>
          </p>
        ) : (
          <p className="text-xs text-ink-subtle">Need the format? Start from the Reyvoca template.</p>
        )}
        <Action variant="secondary" size="sm" onClick={downloadCsvTemplate}>
          <Download className="size-4" aria-hidden="true" /> Download CSV template
        </Action>
      </div>
    </div>
  );
}
