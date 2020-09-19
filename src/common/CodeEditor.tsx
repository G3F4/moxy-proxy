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
  const [draft, setDraft] = useState(code);
  const [editing, setEditing] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  function handleEditorReady() {
    setEditorReady(true);
  }

  function handleSave() {
    setEditing(false);
    onSave(draft);
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body1">{title}</Typography>
        {editorReady && editing ? (
          <Button onClick={handleSave}>Done</Button>
        ) : (
          <Button onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>
      <div>
        {editing ? (
          <Editor
            autoHeight
            code={draft}
            language={language}
            onReady={handleEditorReady}
            onSave={setDraft}
          />
        ) : (
          <SyntaxHighlighter language={language}>
            {code.trim()}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
