import { Button } from '@material-ui/core';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import Editor from '@monaco-editor/react';
import React, { useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export default function RouteCode({
  responseCode,
  serverStateUpdateCode,
  onResponseCodeSave,
  onServerStateUpdateCodeSave,
}: {
  responseCode: string,
  serverStateUpdateCode: string,
  onResponseCodeSave: any,
  onServerStateUpdateCodeSave: any,
}) {
  const [responseEditing, setResponseEditing] = useState(false);
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
    // @ts-ignore
    onResponseCodeSave(responseEditorValueGetter.current());
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
    // @ts-ignore
    onServerStateUpdateCodeSave(serverStateUpdateValueGetter.current());
  }
  
  return (
    <>
      <ExpansionPanelDetails style={{ paddingBottom: 0, alignItems: 'center' }}>
        <Typography variant="body1">
          Response
        </Typography>
        {responseEditing ? (
          <Button
            disabled={!responseEditorReady}
            style={{ marginLeft: 'auto' }}
            onClick={handleResponseSave}
          >Save</Button>
        ) : (
          <Button
            style={{ marginLeft: 'auto' }}
            onClick={() => setResponseEditing(true)}
          >Edit</Button>
        )}
      </ExpansionPanelDetails>
      <ExpansionPanelDetails>
        {responseEditing ? (
          <Editor
            editorDidMount={handleResponseEditorDidMount}
            height="30vh"
            language="javascript"
            value={responseCode.trim()}
            width="80vw"
          />
        ) : (
          <SyntaxHighlighter customStyle={{ width: '100%' }} language="javascript">
            {responseCode.trim()}
          </SyntaxHighlighter>
        )}
      </ExpansionPanelDetails>
      
      <ExpansionPanelDetails style={{ paddingBottom: 0, alignItems: 'center' }}>
        <Typography variant="body1">
          Server update
        </Typography>
        {serverStateUpdateEditing ? (
          <Button
            disabled={!serverStateUpdateEditorReady}
            style={{ marginLeft: 'auto' }}
            onClick={handleServerStateUpdateSave}
          >Save</Button>
        ) : (
          <Button
            style={{ marginLeft: 'auto' }}
            onClick={() => setServerStateUpdateEditing(true)}
          >Edit</Button>
        )}
      </ExpansionPanelDetails>
      <ExpansionPanelDetails style={{ paddingBottom: 0 }}>
        {serverStateUpdateEditing ? (
          <Editor
            editorDidMount={handleServerStateUpdateEditorDidMount}
            height="30vh"
            language="javascript"
            value={serverStateUpdateCode.trim()}
            width="80vw"
          />
        ) : (
          <SyntaxHighlighter customStyle={{ width: '100%' }} language="javascript">
            {serverStateUpdateCode.trim()}
          </SyntaxHighlighter>
        )}
      </ExpansionPanelDetails>
    </>
  );
}