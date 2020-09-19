import { Tab } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import React, { ChangeEvent, useState } from 'react';
import { Endpoint as EndpointInterface } from '../../../sharedTypes';
import Endpoint from './Endpoint';

export default function EndpointGroup({
  endpoints,
}: {
  endpoints: EndpointInterface[];
}) {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>(
    endpoints[0].method,
  );

  function handleActiveTabChange(event: ChangeEvent<{}>, newValue: string) {
    setExpandedEndpoint(newValue);
  }

  const endpoint = endpoints.find(({ method }) => method === expandedEndpoint);
  const endpointsMethods = endpoints.map(({ method }) => method);

  return (
    <>
      <Tabs
        centered
        indicatorColor="primary"
        textColor="primary"
        value={expandedEndpoint}
        onChange={handleActiveTabChange}
      >
        {endpointsMethods.map(method => (
          <Tab key={method} label={method.toUpperCase()} value={method} />
        ))}
      </Tabs>
      {endpoint && <Endpoint endpoint={endpoint} />}
    </>
  );
}
