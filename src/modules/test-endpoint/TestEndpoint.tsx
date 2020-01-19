import { IconButton, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Close } from '@material-ui/icons';
import React, { useContext, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Endpoint } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import CodeEditor from '../common/CodeEditor';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  }),
);

const emptyJsonString = `
{}
`;

export default function TestEndpoint({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [requestBody, setRequestBody] = useState(emptyJsonString);
  const [responseJson, setResponseJson] = useState(emptyJsonString);
  const theme = useTheme();
  const classes = useStyles();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { testEndpoint } = useContext(AppStateContext);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleTest() {
    const response = await testEndpoint(endpoint, requestBody);

    if (response.status < 300) {
      try {
        const data = await response.json();

        setResponseJson(JSON.stringify(data));
      } catch (e) {
        setResponseJson('');
      }
    }
  }

  return (
    <div>
      <Button onClick={handleClickOpen}>Test endpoint</Button>
      <Dialog
        closeAfterTransition
        aria-labelledby="max-width-dialog-title"
        fullScreen={fullScreen}
        maxWidth="md"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle disableTypography id="max-width-dialog-title">
          <Typography variant="h6" style={{ marginRight: 40 }}>{`Test endpoint ${endpoint.method}:${endpoint.url}`}</Typography>
          <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <CodeEditor
          code={requestBody}
          language="json"
          title="Request body"
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
