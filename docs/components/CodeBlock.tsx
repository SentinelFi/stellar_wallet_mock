"use client";

import { useState } from "react";

export default function CodeBlock({
  code,
  language = "typescript",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      {filename && (
        <div className="bg-surface-lighter px-4 py-2 rounded-t-lg text-xs text-text-muted border border-b-0 border-border">
          {filename}
        </div>
      )}
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-surface-lighter text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className={filename ? "!rounded-t-none !mt-0" : ""}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
