import getApplicationBar from './appBar';
import getEndpointsView from './getEndpointsView';
import getViewTabs from './viewTabs';

export default function getApplication() {
  return {
    getApplicationBar,
    getViewTabs,
    views: {
      getEndpointsView,
    },
  }
}
