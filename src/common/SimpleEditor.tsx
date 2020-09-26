import MonacoEditor from '@monaco-editor/react';
import React, { MutableRefObject } from 'react';

const lineHeight = 18;

export function SimpleEditor({
  initialCode,
  autoHeight,
  language,
  valueGetter,
  onReady,
}: {
  initialCode: string;
  language: string;
  autoHeight?: boolean;
  valueGetter: MutableRefObject<any>;
  onReady?(): void;
}) {
  function handleEditorDidMount(getter: (() => string) | undefined) {
    onReady && onReady();
    valueGetter.current = getter;
  }

  const linesCount = initialCode.split(/\r\n|\r|\n/).length + 3;
  const height = autoHeight ? `${linesCount * lineHeight}px` : '500px';

  return (
    <MonacoEditor
      editorDidMount={handleEditorDidMount}
      height={height}
      language={language}
      value={initialCode.trim()}
      width="100%"
    />
  );
}
