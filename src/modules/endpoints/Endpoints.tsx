import { Paper } from '@material-ui/core';
import MuiExpansionPanel from '@material-ui/core/ExpansionPanel';
import MuiExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import produce from 'immer';
import React, { ChangeEvent, useContext, useState } from 'react';
import { Endpoint as EndpointInterface } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import AddEndpoint from '../add-endpoint/AddEndpoint';
import Endpoint from './Endpoint';
import EndpointGroup from './EndpointGroup';

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
});
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

export default function Endpoints() {
  const classes = useStyles();
  const { endpoints } = useContext(AppStateContext);
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    return produce(acc, draft => {
      if (draft[endpoint.url]) {
        draft[endpoint.url].push(endpoint);
      } else {
        draft[endpoint.url] = [endpoint];
      }
    });
  }, {} as Record<string, EndpointInterface[]>);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | false>(false);
  const handleChange = (panel: string) => (event: ChangeEvent<{}>, newExpanded: boolean) => {
    setExpandedEndpoint(newExpanded ? panel : false);
  };

  return (
    <div className={classes.root}>
      <Typography style={{ margin: 8 }} variant="h5">
        Endpoints
      </Typography>
      <Paper>
        {endpoints.length === 0 && (
          <>
            <Typography variant="caption">No endpoint defined.</Typography>
            <AddEndpoint />
          </>
        )}
        {Object.entries(groupedEndpoints).map(([url, endpoints]) => {
          if (endpoints.length > 1) {
            return (
              <ExpansionPanel square expanded={expandedEndpoint === url} onChange={handleChange(url)}>
                <ExpansionPanelSummary>
                  <Typography>{`Group URL: ${url}`}</Typography>
                </ExpansionPanelSummary>
                <EndpointGroup endpoints={endpoints} url={url} />
              </ExpansionPanel>
            );
          }

          return (
            <ExpansionPanel square expanded={expandedEndpoint === url} onChange={handleChange(url)}>
              <ExpansionPanelSummary>
                <Typography>{`${endpoints[0].method.toUpperCase()}: ${url}`}</Typography>
              </ExpansionPanelSummary>
              <Endpoint endpoint={endpoints[0]} />
            </ExpansionPanel>
          );
        })}
      </Paper>
    </div>
  );
}
