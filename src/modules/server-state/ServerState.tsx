import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import React, {useState} from 'react';
import ReactJson from 'react-json-view';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';

export default function ServerState({ state, setState }: { state: any, setState: (value: any) => any }) {
  const [edit, setEdit] = useState(false);
  
  function startEditing() {
    setEdit(true);
  }
  function doneEditing() {
    setEdit(false);
  }
  
  return (
    <div>
      <Typography variant="body1">Server state</Typography>
      <ReactJson src={state} />
      {edit ? (
        <Button onClick={doneEditing}>Done</Button>
      ) : (
        <Button onClick={startEditing}>Edit</Button>
      )}
      {edit && (
        <Editor
          value={state}
          onChange={setState}
        />
      )}
    </div>
  )
}