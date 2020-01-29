import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
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
        </div>
      </div>
      {!editing && <ReactJson name="state" src={serverState} />}
      {editing && (
        <Editor
          code={JSON.stringify(serverState, null, 2)}
          onSave={handleSave}
          language="json"
          autoHeight
        />
      )}
    </>
  );
}
