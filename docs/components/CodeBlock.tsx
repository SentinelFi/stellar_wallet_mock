"use client";

import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

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

  // Map language aliases
  const lang = language === "bash" || language === "shell" ? "bash" : language;

  return (
    <div className="relative group my-4">
      {filename && (
        <div className="bg-surface-lighter px-4 py-2 rounded-t-lg text-xs text-text-muted border border-b-0 border-border flex items-center justify-between">
          <span>{filename}</span>
          <span className="text-text-muted/50 uppercase text-[10px] tracking-wider">
            {lang}
          </span>
        </div>
      )}
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-surface-lighter text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <Highlight theme={themes.nightOwl} code={code.trim()} language={lang}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={filename ? "!rounded-t-none !mt-0" : ""}
            style={{ ...style, backgroundColor: "transparent" }}
          >
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell pr-4 text-right select-none text-text-muted/30 text-xs w-8">
                    {i + 1}
                  </span>
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
