import { TextField } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { Endpoint } from '../../../sharedTypes';

export const urlDelimiter = ':';

export default function UrlParameters({
  endpoint,
  urlParameters,
  setUrlParameters,
}: {
  endpoint: Endpoint;
  urlParameters: any;
  setUrlParameters: any;
}) {
  const urlParts = endpoint.url.split('/').filter(Boolean);

  return (
    <>
      <Typography style={{ flexGrow: 1 }} variant="subtitle2">
        Fill url parameters
      </Typography>
      <div style={{ display: 'flex' }}>
        {urlParts.map(part => {
          const urlParameter = part[0] === urlDelimiter;

          if (urlParameter) {
            const parameterName = part.slice(1);
            const value = urlParameters[parameterName];

            return (
              <TextField
                required
                label={parameterName}
                placeholder="Set parameter value"
                value={value}
                onChange={event => {
                  setUrlParameters({
                    ...urlParameters,
                    [parameterName]: event.target.value,
                  });
                }}
              />
            );
          } else {
            return (
              <Typography
                style={{ marginTop: 20, marginRight: 5 }}
                variant="body1"
              >{`${part} /`}</Typography>
            );
          }
        })}
      </div>
    </>
  );
}
