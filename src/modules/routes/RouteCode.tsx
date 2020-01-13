import {Button} from '@material-ui/core';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import Editor from '@monaco-editor/react';
import React, {useRef, useState} from 'react';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';

export default function RouteCode({
  responseCode,
  serverStateUpdateCode,
}: { responseCode: string, serverStateUpdateCode: string }) {
  const [response, setResponse] = useState(responseCode.trim());
  const [responseEditing, setResponseEditing] = useState(false);
  const [serverStateUpdate, setServerStateUpdate] = useState(serverStateUpdateCode.trim());
  const [serverStateUpdateEditing, setServerStateUpdateEditing] = useState(false);
  
  const [responseEditorReady, setResponseEditorReady] = useState(false);
  const responseEditorValueGetter = useRef();
  
  function handleResponseEditorDidMount(_valueGetter: any) {
    setResponseEditorReady(true);
    responseEditorValueGetter.current = _valueGetter;
  }
  
  function handleResponseSave() {
    // @ts-ignore
    console.log(['code'], responseEditorValueGetter.current());
    setResponseEditing(false);
  }
  
  const [serverStateUpdateEditorReady, setServerStateUpdateEditorReady] = useState(false);
  const serverStateUpdateValueGetter = useRef();
  
  function handleServerStateUpdateEditorDidMount(_valueGetter: any) {
    setServerStateUpdateEditorReady(true);
    serverStateUpdateValueGetter.current = _valueGetter;
  }
  
  function handleServerStateUpdateSave() {
    // @ts-ignore
    onChange(valueGetter.current());
    // @ts-ignore
    console.log(['code'], valueGetter.current());
    setServerStateUpdateEditing(false);
  }
  
  return (
    <>
      <ExpansionPanelDetails style={{ paddingBottom: 0, alignItems: 'center' }}>
        <Typography variant="body1">
          Response
        </Typography>
        {responseEditing ? (
          <Button
            onClick={handleResponseSave}
            disabled={!responseEditorReady}
            style={{ marginLeft: 'auto' }}
          >Save</Button>
        ) : (
          <Button
            onClick={() => setResponseEditing(true)}
            style={{ marginLeft: 'auto' }}
          >Edit</Button>
        )}
      </ExpansionPanelDetails>
      <ExpansionPanelDetails>
        {responseEditing ? (
          <Editor
            height="50vh"
            width="80vw"
            language="javascript"
            value={response}
            editorDidMount={handleResponseEditorDidMount}
          />
        ) : (
          <SyntaxHighlighter language="javascript" customStyle={{ width: '100%' }}>
            {response}
          </SyntaxHighlighter>
        )}
      </ExpansionPanelDetails>
      
      <ExpansionPanelDetails style={{ paddingBottom: 0, alignItems: 'center' }}>
        <Typography variant="body1">
          Server update
        </Typography>
        {serverStateUpdateEditing ? (
          <Button
            onClick={handleServerStateUpdateSave}
            disabled={!serverStateUpdateEditorReady}
            style={{ marginLeft: 'auto' }}
          >Save</Button>
        ) : (
          <Button
            onClick={() => setServerStateUpdateEditing(true)}
            style={{ marginLeft: 'auto' }}
          >Edit</Button>
        )}
      </ExpansionPanelDetails>
      <ExpansionPanelDetails style={{ paddingBottom: 0 }}>
        {serverStateUpdateEditing ? (
          <Editor
            height="50vh"
            width="80vw"
            language="javascript"
            value={serverStateUpdate}
            editorDidMount={handleServerStateUpdateEditorDidMount}
          />
        ) : (
          <SyntaxHighlighter language="javascript" customStyle={{ width: '100%' }}>
            {serverStateUpdate}
          </SyntaxHighlighter>
        )}
      </ExpansionPanelDetails>
    </>
  );
}