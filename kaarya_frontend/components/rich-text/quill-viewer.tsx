"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import DOMPurify from "isomorphic-dompurify";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

type QuillViewerProps = {
  value: string;
  className?: string;
};

export function QuillViewer({ value, className }: QuillViewerProps) {
  const normalizedValue = React.useMemo(() => {
    const source = value?.trim() || "";
    if (!source) return "<p></p>";

    if (/<[^>]+>/.test(source)) {
      return DOMPurify.sanitize(source);
    }

    return DOMPurify.sanitize(
      source
        .split("\n")
        .map((line) => `<p>${line || "<br/>"}</p>`)
        .join(""),
    );
  }, [value]);

  return (
    <div className={className}>
      <ReactQuill
        value={normalizedValue}
        readOnly
        theme="bubble"
        modules={{ toolbar: false }}
      />
    </div>
  );
}
