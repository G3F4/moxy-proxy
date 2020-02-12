import { TextField } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { Endpoint } from '../../../sharedTypes';

export default function QueryParameters({
  endpoint,
  queryParams,
  setQueryParams,
}: {
  endpoint: Endpoint;
  queryParams: any;
  setQueryParams: any;
}) {
  return (
    <>
      <Typography variant="subtitle2">Fill query parameters</Typography>
      <div style={{ display: 'flex' }}>
        {endpoint.parameters.map(({ id, name, type }, index) => (
          <>
            <Typography style={{ marginTop: 20, marginRight: 5 }} variant="body1">{`${
              index > 0 ? '& ' : ''
            }${name} = `}</Typography>
            <TextField
              label={name}
              placeholder="Set query parameter value"
              value={queryParams[name]}
              onChange={event => {
                setQueryParams({
                  ...queryParams,
                  [name]: event.target.value,
                });
              }}
            />
          </>
        ))}
      </div>
    </>
  );
}
