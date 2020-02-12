import { IconButton } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import React, { SyntheticEvent, useState } from 'react';
import { Endpoint } from '../../../sharedTypes';

export default function CopyCurl({
  endpoint,
  queryString,
  requestBody,
}: {
  endpoint: Endpoint;
  queryString: string;
  requestBody: string;
}) {
  const [open, setOpen] = useState(false);
  const handleClick = async () => {
    setOpen(true);
    await navigator.clipboard.writeText(
      `curl -i --header "Content-Type: application/json" --request ${endpoint.method.toLocaleUpperCase()} --data '${JSON.stringify(
        JSON.parse(requestBody),
      )}' ${window.location.origin}/${endpoint.url}?${queryString}`,
    );
  };
  const handleClose = (event: SyntheticEvent | MouseEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleClick}>Copy CURL to clipboard</Button>
      <Snackbar
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        autoHideDuration={6000}
        message="CURL copied to clipboard!"
        open={open}
        onClose={handleClose}
      />
    </div>
  );
}
