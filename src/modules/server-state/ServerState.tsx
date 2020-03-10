import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import React, { useContext, useState } from 'react';
import ReactJson from 'react-json-view';
import { ServerState as ServerStateInterface } from '../../../interfaces';
import { AppStateContext } from '../../App';
import { Editor } from '../../common/Editor';
import AddServerScenario from './add-server-scenario/AddServerScenario';
import ServerStateMenu from './ServerStateMenu';

export default function ServerState() {
  const { serverState, resetServerState, updateServerState, deleteStateScenario } = useContext(AppStateContext);
  const [editing, setEditing] = useState(false);
  const [invalidJson, setInvalidJson] = useState(false);
  const [draftCode, setDraftCode] = useState(JSON.stringify(serverState, null, 2));

  function handleStartEditing() {
    setEditing(true);
  }

  function handleDoneEditing() {
    setEditing(false);
    updateServerState(JSON.parse(draftCode) as ServerStateInterface);
  }

  function handleSave(code: string) {
    setDraftCode(code);
    try {
      JSON.parse(code);
      setInvalidJson(false);
    } catch (e) {
      setInvalidJson(true);
    }
  }

  async function handleUpdateWithClipboard() {
    const serverState = await navigator.clipboard.readText();

    try {
      updateServerState(JSON.parse(serverState));
    } catch (e) {
      console.error(['handleUpdateWithClipboard.error'], e.toString());
    }
  }

  function handleDeleteScenario() {
    deleteStateScenario();
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
        <div style={{ display: 'flex' }}>
          {editing ? (
            <Button onClick={handleDoneEditing} disabled={invalidJson}>Done</Button>
          ) : (
            <Button onClick={handleStartEditing}>Edit</Button>
          )}
          <AddServerScenario />
          <ServerStateMenu
            actions={[
              { label: 'Reset server', onClick: resetServerState },
              { label: 'Copy to clipboard', onClick: handleCopyToClipboard },
              { label: 'Update with clipboard', onClick: handleUpdateWithClipboard },
              { label: 'Delete scenario', onClick: handleDeleteScenario },
            ]}
          />
        </div>
      </div>
      <Paper style={{ padding: 10 }}>
        {!editing && <ReactJson name="state" src={serverState} />}
        {editing && (
          <Editor
            autoHeight
            code={draftCode}
            language="json"
            onSave={handleSave}
          />
        )}
      </Paper>
    </>
  );
}
