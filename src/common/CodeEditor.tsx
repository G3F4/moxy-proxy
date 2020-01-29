import { Button } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Editor } from './Editor';

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
    <div style={{ width: '100%' }}>
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
          <Editor
            code={code}
            onReady={handleEditorReady}
            onSave={onSave}
            language={language}
            autoHeight
          />
        ) : (
          <SyntaxHighlighter language={language}>{code.trim()}</SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
