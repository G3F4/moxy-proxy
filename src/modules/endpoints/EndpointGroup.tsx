import MuiExpansionPanel from '@material-ui/core/ExpansionPanel';
import MuiExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { ChangeEvent, useState } from 'react';
import { Endpoint as EndpointInterface } from '../../../sharedTypes';
import Endpoint from './Endpoint';

const ExpansionPanel = withStyles({
  root: {
    border: '1px solid rgba(0, 0, 0, .125)',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      margin: 'auto',
    },
  },
  expanded: {},
})(MuiExpansionPanel);
const ExpansionPanelSummary = withStyles({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    borderBottom: '1px solid rgba(0, 0, 0, .125)',
    marginBottom: -1,
    minHeight: 56,
    '&$expanded': {
      minHeight: 56,
    },
  },
  content: {
    '&$expanded': {
      margin: '12px 0',
    },
  },
  expanded: {},
})(MuiExpansionPanelSummary);

export default function EndpointGroup({
  url,
  endpoints,
}: {
  url: string;
  endpoints: EndpointInterface[];
}) {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | false>(false);
  const handleChange = (panel: string) => (event: ChangeEvent<{}>, newExpanded: boolean) => {
    setExpandedEndpoint(newExpanded ? panel : false);
  };

  return (
    <>
      {endpoints.map(endpoint => (
        <ExpansionPanel
          square
          expanded={expandedEndpoint === endpoint.method}
          style={{ marginLeft: 20 }}
          onChange={handleChange(endpoint.method)}
        >
          <ExpansionPanelSummary>
            <Typography>{endpoint.method}</Typography>
          </ExpansionPanelSummary>
          <Endpoint endpoint={endpoint} />
        </ExpansionPanel>
      ))}
    </>
  );
}
