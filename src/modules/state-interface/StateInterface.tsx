import { Typography } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import React, { useContext } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { AppStateContext } from '../../App';

export default function StateInterface() {
  const { serverStateInterface } = useContext(AppStateContext);

  return (
    <>
      <Typography style={{ margin: 8 }} variant="h5">
        Interface
      </Typography>
      <Paper>
        <SyntaxHighlighter customStyle={{ width: '100%' }} language="typescript">
          {serverStateInterface.trim()}
        </SyntaxHighlighter>
      </Paper>
    </>
  );
}
