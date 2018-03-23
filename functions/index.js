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

const {actionssdk} = require('actions-on-google');
const Eliza = require('elizabot');
const functions = require('firebase-functions');

const app = actionssdk({debug: true});

/**
 * Handles the MAIN intent coming from Assistant, when the user first engages
 * with the app, expecting for an initial greeting from Eliza.
 */
app.intent('actions.intent.MAIN', (conv) => {
  const eliza = new Eliza();
  conv.data.elizaInstance = eliza;
  conv.ask(eliza.getInitial());
});

/**
 * Handles the intent where the user invokes with a query to be
 * handled by Eliza.
 *
 * This intent is triggered when the user invokes the Raw Input
 * action by calling Eliza and already sending an initial prompt,
 * e.g. "Tell Eliza my emotional state is distressed", in which case
 * the value of `feelings` would be 'distressed'.
 */
app.intent('raw.input', (conv, input) => {
  const eliza = new Eliza();
  const feelings = conv.arguments.get('feelings');
  const elizaReply = feelings ? eliza.transform(feelings) : eliza.getInitial();
  conv.data.elizaInstance = eliza;
  conv.ask(elizaReply);
});

/**
 * Handles the intent where the user returns a query to be handled by Eliza.
 *
 * This intent is triggered inside the dialogs when the user already has a
 * conversation going on with Eliza
 */
app.intent('actions.intent.TEXT', (conv, input) => {
  const eliza = new Eliza();

  // Reloads the previous Eliza instance in case this is an ongoing conversation
  const previousEliza = conv.data.elizaInstance;
  if (previousEliza) {
    eliza.quit = previousEliza.quit;
    eliza.mem = previousEliza.mem;
    eliza.lastChoice = previousEliza.lastChoice;
  }

  const elizaReply = eliza.transform(input);
  if (eliza.quit) {
    conv.close(eliza.getFinal());
  } else {
    conv.data.elizaInstance = eliza;
    conv.ask(elizaReply);
  }
});

/**
 * Handles the post request incoming from Assistant.
 */
exports.eliza = functions.https.onRequest(app);
