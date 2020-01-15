import { Button } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Editor from '@monaco-editor/react';
import React, { useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export default function CodeEditor({ code, title, onSave }: { code: string; title?: string; onSave: any; }) {
  const [editing, setEditing] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const valueGetter = useRef();

  function handleServerStateUpdateEditorDidMount(_valueGetter: any) {
    setEditorReady(true);
    valueGetter.current = _valueGetter;
  }

  function handleSave() {
    setEditing(false);
    // @ts-ignore
    onSave(valueGetter.current());
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
          <Button onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      <div>
        {editing ? (
          <Editor
            editorDidMount={handleServerStateUpdateEditorDidMount}
            height="30vh"
            language="javascript"
            value={code.trim()}
            width="90vw"
          />
        ) : (
          <SyntaxHighlighter customStyle={{ width: '100%' }} language="javascript">
            {code.trim()}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
