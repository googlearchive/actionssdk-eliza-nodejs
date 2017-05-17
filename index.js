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

'use strict';

process.env.DEBUG = 'actions-on-google:*';

const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;
const Eliza = require('elizabot');

// Intent constants
const RAW_INTENT = 'raw.input';
const INVOCATION_ARGUMENT = 'feelings';

/**
 * Handles the MAIN intent coming from Assistant, when the user first engages
 * with the app, expecting for an initial greeting from Eliza.
 */
const mainIntentHandler = (app) => {
  console.log('MAIN intent triggered.');
  const eliza = new Eliza();
  app.ask(eliza.getInitial(), {elizaInstance: eliza});
};

/**
 * Handles the intent where the user invokes with a query to be handled by Eliza.
 *
 * This intent is triggered when the user invokes the Raw Input action by calling
 * Eliza and already sending an initial prompt.
 */
const rawInputIntentHandler = (app) => {
  console.log('raw.input intent triggered.');
  const eliza = new Eliza();
  const elizaReply = eliza.transform(app.getArgument(INVOCATION_ARGUMENT));
  app.ask(elizaReply, {elizaInstance: eliza});
};

/**
 * Handles the intent where the user returns a query to be handled by Eliza.
 *
 * This intent is triggered inside the dialogs when the user already has a
 * conversation going on with Eliza
 */
const textIntentHandler = (app) => {
  console.log('TEXT intent triggered.');
  const eliza = new Eliza();

  // Reloads the previous instance of Eliza in case this is an ongoing conversation
  const previousEliza = app.getDialogState().elizaInstance;
  if (previousEliza) {
    eliza.quit = previousEliza.quit;
    eliza.mem = previousEliza.mem;
    eliza.lastChoice = previousEliza.lastChoice;
  }

  const elizaReply = eliza.transform(app.getRawInput());
  if (eliza.quit) {
    app.tell(eliza.getFinal());
  } else {
    app.ask(elizaReply, {elizaInstance: eliza});
  }
};

/**
 * Handles the post request incoming from Assistant.
 */
exports.eliza = (request, response) => {
  console.log('Incoming post request...');
  const app = new ActionsSdkApp({request, response});

  // Map that contains the intents and respective handlers to be used by the
  // actions client library
  const actionMap = new Map();

  /**
   * Configures the post request handler by setting the intent map to the
   * right functions.
   */
  actionMap.set(app.StandardIntents.MAIN, mainIntentHandler);
  actionMap.set(RAW_INTENT, rawInputIntentHandler);
  actionMap.set(app.StandardIntents.TEXT, textIntentHandler);

  app.handleRequest(actionMap);
};
