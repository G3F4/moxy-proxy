import { TextField } from '@material-ui/core';
import React from 'react';

export default function UrlPatternStep({ url, onUrlChange }: { url: string; onUrlChange: any }) {
  return (
    <TextField
      label="URL pattern"
      name="url"
      value={url}
      onChange={event => onUrlChange(event.target.value)}
    />
  );
}
