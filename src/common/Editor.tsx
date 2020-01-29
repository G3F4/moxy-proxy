import MonacoEditor from '@monaco-editor/react';
import React, { MutableRefObject, useEffect, useRef } from 'react';

function useAutoSave(
  editorRef: MutableRefObject<(() => string) | undefined>,
  onSave: (value: string) => void,
) {
  useEffect(() => {
    // TODO make it deferrable so there is only only real request after done editing
    const interval = setInterval(() => {
      editorRef.current && onSave(editorRef.current());
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [editorRef, onSave]);
}

const lineHeight = 18;

export function Editor({
  onSave,
  code,
  autoHeight,
  language,
  onReady,
}: {
  code: string;
  language: string;
  autoHeight?: boolean;
  onSave(value: string): void;
  onReady?(): void;
}) {
  const editorRef = useRef<() => string>();

  useAutoSave(editorRef, onSave);

  function handleEditorDidMount(valueGetter: (() => string) | undefined) {
    onReady && onReady();
    editorRef.current = valueGetter;
  }

  const linesCount = code.split(/\r\n|\r|\n/).length;
  const height = autoHeight ? `${linesCount * lineHeight}px` : '500px';

  return (
    <MonacoEditor
      editorDidMount={handleEditorDidMount}
      height={height}
      language={language}
      value={code.trim()}
      width="100%"
    />
  );
}
