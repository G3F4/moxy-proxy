import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import React, { useContext, useState } from 'react';
import ReactJson from 'react-json-view';
import { ServerState as ServerStateInterface } from '../../../interfaces';
import { AppStateContext } from '../../App';
import { Editor } from '../../common/Editor';

export default function ServerState() {
  const { serverState, resetServerState, updateServerState } = useContext(AppStateContext);
  const [editing, setEditing] = useState(false);

  function handleStartEditing() {
    setEditing(true);
  }

  function handleDoneEditing() {
    setEditing(false);
  }

  function handleSave(code: string) {
    updateServerState(JSON.parse(code) as ServerStateInterface);
  }

  async function handleUpdateWithClipboard() {
    const serverState = await navigator.clipboard.readText();

    try {
      updateServerState(JSON.parse(serverState));
    } catch (e) {
      console.error(['handleUpdateWithClipboard.error'], e.toString());
    }
  }

  async function handleCopyToClipboard() {
    await navigator.clipboard.writeText(JSON.stringify(serverState, null, 2));
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography style={{ margin: 8 }} variant="h5">
          Server state
        </Typography>
        <div>
          {editing ? (
            <Button onClick={handleDoneEditing}>Done</Button>
          ) : (
            <Button onClick={handleStartEditing}>Edit</Button>
          )}
          <Button onClick={resetServerState}>Reset server</Button>
          <Button onClick={handleCopyToClipboard}>Copy to clipboard</Button>
          <Button onClick={handleUpdateWithClipboard}>Update with clipboard</Button>
        </div>
      </div>
      <Paper style={{ padding: 10 }}>
        {!editing && <ReactJson name="state" src={serverState} />}
        {editing && (
          <Editor
            autoHeight
            code={JSON.stringify(serverState, null, 2)}
            language="json"
            onSave={handleSave}
          />
        )}
      </Paper>
    </>
  );
}
