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

const ActionsSdkAssistant = require('./actions-on-google').ActionsSdkAssistant;
const Eliza = require('elizabot');
const express = require('express');
const bodyParser = require('body-parser');

const RAW_INTENT = 'raw.input';

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const mainIntentHandler = (assistant) => {
  console.log('mainIntent');
  const eliza = new Eliza();
  assistant.ask(eliza.getInitial(),
    [{'intent': RAW_INTENT}],
    ["$SchemaOrg_Text"],
    {elizaInstance: eliza});
};

const rawIntentHandler = (assistant) => {
  console.log('rawInput');
  const eliza = new Eliza();
  const previousEliza = assistant.getDialogState().elizaInstance;
  if (previousEliza) {
    eliza.quit = previousEliza.quit;
    eliza.mem = previousEliza.mem;
    eliza.lastChoice = previousEliza.lastChoice;
  }

  console.log('RAW INPUT: ' + assistant.getRawInput());

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

app.post('/', function (request, response) {
  console.log('handle post');
  const assistant = new ActionsSdkAssistant({request: request, response: response});

  const actionMap = new Map();
  actionMap.set(assistant.StandardIntents.MAIN, mainIntentHandler);
  actionMap.set(RAW_INTENT, rawIntentHandler);

  assistant.handleRequest(actionMap);
});

// Start the server
const server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
