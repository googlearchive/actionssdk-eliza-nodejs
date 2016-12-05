// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

process.env.DEBUG = 'actions-on-google:*';

const ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
const Eliza = require('elizabot');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

/**
 * Handles the main intent coming from Assistant, when the user first engages with the action,
 * asking for an initial prompt from Eliza.
 */
const mainIntentHandler = (assistant) => {
  console.log('Main intent triggered.');
  const eliza = new Eliza();
  assistant.ask(eliza.getInitial(),
    [{'intent': RAW_INTENT}],
    ["$SchemaOrg_Text"],
    {elizaInstance: eliza});
};

/**
 * Handles the intent where the user sends a query to be handled by Eliza.
 *
 * This intent is triggered inside the dialogs when the user already has a conversation going on
 * with Eliza, or when the user 'deep links' into the action by calling Eliza and already sending an
 * initial prompt.
 */
const rawIntentHandler = (assistant) => {
  console.log('Raw input intent triggered.');
  const eliza = new Eliza();

  // Reloads the previous instance of Eliza in case this is an ongoing conversation
  const previousEliza = assistant.getDialogState().elizaInstance;
  if (previousEliza) {
    eliza.quit = previousEliza.quit;
    eliza.mem = previousEliza.mem;
    eliza.lastChoice = previousEliza.lastChoice;
  }

  const elizaReply = eliza.transform(assistant.getRawInput());
  if (eliza.quit) {
    assistant.tell(eliza.getFinal());
  } else {
    assistant.ask(elizaReply,
      [{'intent': RAW_INTENT}],
      ["$SchemaOrg_Text"],
      {elizaInstance: eliza});
  }
};

// Map that contains the intents and respective handlers to be used by the actions client library
const actionMap = new Map();

// Intent constants
const RAW_INTENT = 'raw.input';

/**
 * Configures the post request handler by setting the intent map to the right functions.
 */
actionMap.set(new ActionsSdkAssistant().StandardIntents.MAIN, mainIntentHandler);
actionMap.set(RAW_INTENT, rawIntentHandler);

/**
 * Handles the post request incoming from Assistant.
 */
app.post('/', (request, response) => {
  console.log('Incoming post request...');
  const assistant = new ActionsSdkAssistant({request: request, response: response});
  assistant.handleRequest(actionMap);
});

// Start the server
const server = app.listen(app.get('port'), () => {
  console.log('Eliza endpoint listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
