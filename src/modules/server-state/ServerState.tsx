import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import React, { useContext, useState } from 'react';
import ReactJson from 'react-json-view';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { AppStateContext } from '../../App';

export default function ServerState() {
  const { serverState, serverStateInterface, resetServerState, updateServerState } = useContext(AppStateContext);
  const [editing, setEditing] = useState(false);
  const [editorState, setEditorState] = useState(serverState);

  function startEditing() {
    setEditing(true);
  }

  function doneEditing() {
    setEditing(false);
    updateServerState(editorState);
  }

  return (
    <div>

      {!editing && (
        <ReactJson collapsed src={serverState} />
      )}
      {editing ? (
        <Button onClick={doneEditing}>Done</Button>
      ) : (
        <Button onClick={startEditing}>Edit</Button>
      )}
      <Button onClick={resetServerState}>Reset server</Button>
      {editing && (
        <Editor
          value={editorState}
          onChange={setEditorState}
        />
      )}
      <Typography style={{ margin: 8 }} variant="h5">Interface</Typography>
      <SyntaxHighlighter customStyle={{ width: '100%' }} language="typescript">
        {serverStateInterface.trim()}
      </SyntaxHighlighter>
    </div>
  )
}
