import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import React, { useContext, useState } from 'react';
import ReactJson from 'react-json-view';
import { AppStateContext } from '../../App';

export default function ServerState() {
  const { serverState, resetServerState, updateServerState } = useContext(
    AppStateContext,
  );
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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography style={{ margin: 8 }} variant="h5">
          Server state
        </Typography>
        <div>
          {editing ? (
            <Button onClick={doneEditing}>Done</Button>
          ) : (
            <Button onClick={startEditing}>Edit</Button>
          )}
          <Button onClick={resetServerState}>Reset server</Button>
        </div>
      </div>
      {!editing && <ReactJson name="state" src={serverState} />}
      {editing && <Editor value={editorState} onChange={setEditorState} />}
    </>
  );
}
