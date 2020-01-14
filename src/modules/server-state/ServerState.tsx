import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import React, {useState} from 'react';
import ReactJson from 'react-json-view';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';

export default function ServerState({ serverState, onServerStateChange }: { serverState: any, onServerStateChange: (value: any) => any }) {
  const [editing, setEditing] = useState(false);

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
      {editing && (
        <Editor
          value={serverState}
          onChange={onServerStateChange}
        />
      )}
    </div>
  )
}
