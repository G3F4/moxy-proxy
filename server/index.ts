import './dotenv';
import { SERVER_START_MESSAGE } from './config';
import startApplication from './startApplication';
import { logInfo } from './utils/logger';

startApplication().then(() => {
  console.log(SERVER_START_MESSAGE);
});

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
