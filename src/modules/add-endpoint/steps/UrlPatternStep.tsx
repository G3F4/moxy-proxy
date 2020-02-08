import { TextField } from '@material-ui/core';
import React, { ChangeEvent } from 'react';

const urlBeginChar = '/';

function sanitizeUrl(url: string): string {
  let sanitized = url;
  const firstChar = url[0];

  if (firstChar !== urlBeginChar) {
    sanitized = `${urlBeginChar}${sanitized}`;
  }

  return sanitized;
}

export default function UrlPatternStep({
  url,
  onUrlChange,
}: {
  url: string;
  onUrlChange: (value: string) => void;
}) {
  function handleUrlChange(event: ChangeEvent<HTMLInputElement>) {
    const value = sanitizeUrl(event.target.value);

    onUrlChange(value);
  }

  return (
    <TextField
      autoFocus
      fullWidth
      id="name"
      label="URL pattern"
      margin="dense"
      value={url}
      onChange={handleUrlChange}
    />
  );
}
