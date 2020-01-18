import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import React, { useContext, useState } from 'react';
import ReactJson from 'react-json-view';
import { AppStateContext } from '../../App';

export default function ServerState() {
  const [editing, setEditing] = useState(false);
  const { serverState, resetServerState, updateServerState } = useContext(AppStateContext);

  function startEditing() {
    setEditing(true);
  }

  function doneEditing() {
    setEditing(false);
  }

  return (
    <div>
      <Typography style={{ margin: 8 }} variant="h5">Server state</Typography>
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
          value={serverState}
          onChange={updateServerState}
        />
      )}
    </div>
  )
}
