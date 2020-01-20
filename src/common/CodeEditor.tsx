import { Button } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import MonacoEditor from '@monaco-editor/react';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

function useAutoSave(
  editorRef: MutableRefObject<(() => string) | undefined>,
  onSave: (value: string) => void,
) {
  useEffect(() => {
    const interval = setInterval(() => {
      editorRef.current && onSave(editorRef.current());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [editorRef, onSave]);
}

function Editor({
  onSave,
  code,
  onReady,
}: {
  code: string;
  onSave: (value: string) => void;
  onReady: () => void;
}) {
  const editorRef = useRef<() => string>();

  useAutoSave(editorRef, onSave);

  function handleEditorDidMount(valueGetter: (() => string) | undefined) {
    onReady();
    editorRef.current = valueGetter;
  }

  return (
    <MonacoEditor
      editorDidMount={handleEditorDidMount}
      height="30vh"
      language="javascript"
      value={code.trim()}
      width="90vw"
    />
  );
}

export default function CodeEditor({
  code,
  title,
  language = 'javascript',
  onSave,
}: {
  code: string;
  title?: string;
  language?: string;
  onSave: any;
}) {
  const [editing, setEditing] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  function handleEditorReady() {
    setEditorReady(true);
  }

  function handleSave() {
    setEditing(false);
  }

  return (
    <div style={{ width: '95%' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body1">{title}</Typography>
        {editing ? (
          <Button disabled={!editorReady} onClick={handleSave}>
            Done
          </Button>
        ) : (
          <Button onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>
      <div>
        {editing ? (
          <Editor code={code} onReady={handleEditorReady} onSave={onSave} />
        ) : (
          <SyntaxHighlighter customStyle={{ width: '100%' }} language={language}>
            {code.trim()}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
