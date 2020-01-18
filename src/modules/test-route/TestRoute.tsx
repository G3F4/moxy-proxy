import { useMediaQuery } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React, { useContext, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Route } from "../../../sharedTypes";
import { AppStateContext } from "../../App";
import CodeEditor from "../common/CodeEditor";

const emptyJsonString = `
{}
`;

export default function TestRoute({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const [requestBody, setRequestBody] = useState(emptyJsonString);
  const [responseJson, setResponseJson] = useState(emptyJsonString);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { testRoute } = useContext(AppStateContext);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleTest() {
    const response = await testRoute(route, requestBody);
    const json = await response.json();

    setResponseJson(json.toString());
  }

  return (
    <div>
      <Button onClick={handleClickOpen}>Test route</Button>
      <Dialog
        closeAfterTransition
        aria-labelledby="max-width-dialog-title"
        fullScreen={fullScreen}
        maxWidth="md"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle id="max-width-dialog-title">{`Test route ${route.method}:${route.url}`}</DialogTitle>
        <CodeEditor
          code={requestBody}
          title="Request body"
          language="json"
          onSave={setRequestBody}
        />
        <Button onClick={handleTest}>Test</Button>
        <Typography variant="body1">Response</Typography>
        <SyntaxHighlighter customStyle={{ width: '100%' }} language="json">
          {responseJson.trim()}
        </SyntaxHighlighter>
      </Dialog>
    </div>
  );
}
