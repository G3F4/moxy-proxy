import {Button} from '@material-ui/core';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import Editor from '@monaco-editor/react';
import React, {useContext, useRef, useState} from 'react';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {AppStateContext} from '../../App';

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
            height="30vh"
            width="80vw"
            language="javascript"
            value={responseCode.trim()}
            editorDidMount={handleResponseEditorDidMount}
          />
        ) : (
          <SyntaxHighlighter language="javascript" customStyle={{ width: '100%' }}>
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
            height="30vh"
            width="80vw"
            language="javascript"
            value={serverStateUpdateCode.trim()}
            editorDidMount={handleServerStateUpdateEditorDidMount}
          />
        ) : (
          <SyntaxHighlighter language="javascript" customStyle={{ width: '100%' }}>
            {serverStateUpdateCode.trim()}
          </SyntaxHighlighter>
        )}
      </ExpansionPanelDetails>
    </>
  );
}