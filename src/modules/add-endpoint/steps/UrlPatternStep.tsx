import { TextField } from '@material-ui/core';
import React from 'react';

export default function UrlPatternStep({ url, onUrlChange }: { url: string; onUrlChange: any }) {
  return (
    <TextField
      autoFocus
      fullWidth
      id="name"
      label="URL pattern"
      margin="dense"
      value={url}
      onChange={event => onUrlChange(event.target.value)}
    />
  );
}
