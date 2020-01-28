import { IconButton, TextField, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Close } from '@material-ui/icons';
import React, { useContext, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Endpoint } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import CodeEditor from '../../common/CodeEditor';

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
  const [showRequestBody, setShowRequestBody] = useState(false);
  const [responseJson, setResponseJson] = useState('');
  const [queryString, setQueryString] = useState('');
  const [showQueryString, setShowQueryString] = useState(false);
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
    const response = await testEndpoint(endpoint, queryString, requestBody);

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
        <DialogTitle disableTypography id="max-width-dialog-title" style={{ minWidth: 500 }}>
          <Typography
            style={{ marginRight: 40 }}
            variant="h6"
          >{`Test endpoint ${endpoint.method}:${endpoint.url}`}</Typography>
          <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {showQueryString ? (
            <TextField
              fullWidth
              label="Query string"
              value={queryString}
              onChange={event => setQueryString(event.target.value)}
            />
          ) : (
            <Button onClick={() => setShowQueryString(true)}>Add query string</Button>
          )}
        </DialogContent>
        <DialogContent>
          {showRequestBody ? (
            <CodeEditor
              code={requestBody}
              language="json"
              title="Request body"
              onSave={setRequestBody}
            />
          ) : (
            <Button onClick={() => setShowRequestBody(true)}>Add request body</Button>
          )}
        </DialogContent>
        <DialogContent>
          {responseJson && (
            <>
              <Typography variant="body1">Response</Typography>
              <SyntaxHighlighter language="json">{responseJson.trim()}</SyntaxHighlighter>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTest}>Test</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
