# SmoochBot

SmoochBot is a toolkit that you can use to build automated, intelligent bots that tie into conversations on [Smooch.io](https://smooch.io). 

You can use SmoochBot to:

 * Walk your users through a friendly, guided, on-boarding process
 * Handle common customer support questions
 * Route users to an appropriate team member
 * Provide an automated conversational interface to your app
 * Provide shipping and logistic updates to your customers in response to events in your CRM or E-Commerce system
 * Almost anything else you can imagine!

You can use SmoochBot to have conversation with your users and customers across any platform that we support: In-App iOS and Android, on the web, and over SMS. Conversations with SmoochBot can be supervised by humans on your team and they can join in the discourse at any time using Slack, HipChat, Help Scout, Zendesk or their favourite CRM.

![SmoochBot on the web](https://media.giphy.com/media/3oxRmmmMkNG504mOGY/giphy.gif)

We've based SmoochBot on the awesome [BotKit](http://howdy.ai/botkit). This means that if you're used to writing bots for Slack, bringing your bot building wizardry over to Smooch will be a piece of cake.

## Installation

SmoochBot is available via NPM.

```bash
npm install --save smoochbot
```

You can also check out smoochbot directly from Git.
If you want to use the example code and included bots, it may be preferable to use Github over NPM.

```bash
git clone git@github.com:gozman/smoochbot.git
```

After cloning the Git repository, you have to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.

Alternatively, you can deploy SmoochBot directly to Heroku with this button: <a href="https://heroku.com/deploy?template=https://github.com/gozman/smoochbot">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

## Getting Started

1) Install SmoochBot. See [Installation](#installation) instructions.

2) Create a key/secret from the app settings page in Smooch

3) Configure the following environment variables

| Variable Name | Description
|--- |---
| APPTOKEN | Smooch App Token
| KEY | Smooch API Key
| SECRET | Smooch API Secret
| INCOMING_WEBHOOK | URL of SmoochBot + "/smooch/" (without quotes)
| BOT_NAME | Friendly name of the bot
| AVATAR_URL | URL of an image to use as the bot's avatar

4) Run the bot with 'node smoochy.js'

## Core Concepts

Bots built with Botkit have a few key capabilities, which can be used
to create clever, conversational applications. These capabilities
map to the way real human people talk to each other.

Bots can [hear things](#receiving-messages). Bots can [say things and reply](#sending-messages) to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, Botkit bots have a subsystem available for managing [multi-message conversations](#multi-message-replies-to-incoming-messages). Conversations add features like the ability to ask a question, queue several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond, it is ready to be connected to Smooch's message streams.

## Basic Usage

Here's an example of using SmoochBot to answer people who say "hello".

The Botkit constructor returns a `controller` object. By attaching event handlers
to the controller object, developers can specify what their bot should look for and respond to,
including keywords and patterns. These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human say THIS the bot does THAT."

The `controller` object is then used to `spawn()` bot instances that represent a specific bot identity and connection to Smooch. Once spawned and connected to the API, the bot can be used to send messages and conduct conversations with users. They are called into action by the `controller` when firing event handlers.


```javascript
var Botkit = require('botkit');

var controller = Botkit.smoochbot({
    appToken:process.env.APPTOKEN,
    key:process.env.KEY,
    secret:process.env.SECRET,
    incoming_webhook:{url:process.env.INCOMING_WEBHOOK},
    bot_name:process.env.BOT_NAME,
    avatar_url:process.env.AVATAR_URL
});

//Initialize and setup bot connection to Smooch
var bot = controller.spawn()

bot.configureIncomingWebhook();
controller.startTicking();

controller.setupWebserver(process.env.PORT, function(err, server) {
  controller.createWebhookEndpoints(server);
});

// give the bot something to listen for.
controller.hears('hello','message_received',function(bot,message) {

  bot.reply(message,'Hello from SmoochBot.');

});

```

# Developing with SmoochBot

Table of Contents

* [Receiving Messages](#receiving-messages)
* [Sending Messages](#sending-messages)
* [Working with the Smooch API](#working-with-the-smooch-api)
* [Advanced Topics](#advanced-topics)

## Receiving Messages

Botkit bots receive messages through a system of event handlers. Handlers can be set up to respond to specific types of messages,
or to messages that match a given keyword or pattern.

Currently, only one type of event is supported although this list is expected to increase soon!

| Event | Description
|--- |---
| message_received  | This event is fired for any message of any kind that is received and can be used as a catch all


These message events can be handled using by attaching an event handler to the main controller object.
These event handlers take two parameters: the name of the event, and a callback function which is invoked whenever the event occurs.
The callback function receives a bot object, which can be used to respond to the message, and a message object.

### Matching Patterns and Keywords with `hears()`

In addition to these traditional event handlers, Botkit also provides the `hears()` function,
which configures event handlers based on matching specific keywords or phrases in the message text.
The hears function works just like the other event handlers, but takes a third parameter which
specifies the keywords to match.

| Argument | Description
|--- |---
| patterns | An _array_ or a _comma separated string_ containing a list of regular expressions to match
| types  | An _array_ or a _comma separated string_ of the message events in which to look for the patterns
| callback | callback function that receives a message object

```javascript
controller.hears(['keyword','^pattern$'],'message_received',function(bot,message) {

  // do something to respond to message
  bot.reply(message,'You used a keyword!');

});
```

## Sending Messages

Bots have to send messages to deliver information and present an interface for their
functionality.  Botkit bots can send messages in several different ways, depending
on the type and number of messages that will be sent.

Single message replies to incoming commands can be sent using the `bot.reply()` function.

Multi-message replies, particulary those that present questions for the end user to respond to,
can be sent using the `bot.startConversation()` function and the related conversation sub-functions.

Bots can originate messages - that is, send a message based on some internal logic or external stimulus -
using `bot.say()` method.  

### Single Message Replies to Incoming Messages

Once a bot has received a message using a `on()` or `hears()` event handler, a response
can be sent using `bot.reply()`.

Messages sent using `bot.reply()` are sent immediately. If multiple messages are sent via
`bot.reply()` in a single event handler, they will arrive in the Slack client very quickly
and may be difficult for the user to process. We recommend using `bot.startConversation()`
if more than one message needs to be sent.

### Multi-message Replies to Incoming Messages

For more complex commands, multiple messages may be necessary to send a response,
particularly if the bot needs to collect additional information from the user.

Botkit provides a `Conversation` object type that is used to string together several
messages, including questions for the user, into a cohesive unit. Botkit conversations
provide useful methods that enable developers to craft complex conversational
user interfaces that may span a several minutes of dialog with a user, without having to manage
the complexity of connecting multiple incoming and outgoing messages across
multiple API calls into a single function.

Messages sent as part of a conversation are sent no faster than one message per second,
which roughly simulates the time it would take for the bot to "type" the message.
(It is possible to adjust this delay - see [special behaviors](#special-behaviors))

### Start a Conversation

#### bot.startConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startConversation()` is a function that creates conversation in response to an incoming message.
The conversation will occur _in the same channel_ in which the incoming message was received.
Only the user who sent the original incoming message will be able to respond to messages in the conversation.

### Control Conversation Flow

#### conversation.say()
| Argument | Description
|---  |---
| message   | String or message object

Call convo.say() several times in a row to queue messages inside the conversation. Only one message will be sent at a time, in the order they are queued.

```javascript
controller.hears(['hello world'],'message_received',function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.say('Hello!');
    convo.say('Have a nice day!');

  })

});
```

#### conversation.ask()
| Argument | Description
|---  |---
| message   | String or message object containing the question
| callback _or_ array of callbacks   | callback function in the form function(response_message,conversation), or array of objects in the form ``{ pattern: regular_expression, callback: function(response_message,conversation) { ... } }``
| capture_options | _Optional_ Object defining options for capturing the response

When passed a callback function, conversation.ask will execute the callback function for any response.
This allows the bot to respond to open ended questions, collect the responses, and handle them in whatever
manner it needs to.

When passed an array, the bot will look first for a matching pattern, and execute only the callback whose
pattern is matched. This allows the bot to present multiple choice options, or to proceed
only when a valid response has been received. At least one of the patterns in the array must be marked as the default option,
which will be called should no other option match. Botkit comes pre-built with several useful patterns which can be used with this function. See [included utterances](#included-utterances)

Callback functions passed to `ask()` receive two parameters - the first is a standard message object containing
the user's response to the question. The second is a reference to the conversation itself.

Note that in order to continue the conversation, `convo.next()` must be called by the callback function. This
function tells Botkit to continue processing the conversation. If it is not called, the conversation will hang
and never complete causing memory leaks and instability of your bot application!

The optional third parameter `capture_options` can be used to define different behaviors for collecting the user's response.
This object can contain the following fields:

| Field | Description
|--- |---
| key | _String_ If set, the response will be stored and can be referenced using this key
| multiple | _Boolean_ if true, support multi-line responses from the user (allow the user to respond several times and aggregate the response into a single multi-line value)


##### Using conversation.ask with a callback:

```javascript
controller.hears(['question me'],'message_received',function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.ask('How are you?',function(response,convo) {

      convo.say('Cool, you said: ' + response.text);
      convo.next();

    });

  })

});
```

##### Using conversation.ask with an array of callbacks:

```javascript
controller.hears(['question me'],'message_received',function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.ask('Shall we proceed Say YES, NO or DONE to quit.',[
      {
        pattern: 'done',
        callback: function(response,convo) {
          convo.say('OK you are done!');
          convo.next();
        }
      },
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say('Great! I will continue...');
          // do something else...
          convo.next();

        }
      },
      {
        pattern: bot.utterances.no,
        callback: function(response,convo) {
          convo.say('Perhaps later.');
          // do something else...
          convo.next();
        }
      },
      {
        default: true,
        callback: function(response,convo) {
          // just repeat the question
          convo.repeat();
          convo.next();
        }
      }
    ]);

  })

});
```

##### Multi-stage conversations

The recommended way to have multi-stage conversations is with multiple functions
which call eachother. Each function asks just one question. Example:

```javascript
controller.hears(['pizzatime'],['ambient'],function(bot,message) {
  bot.startConversation(message, askFlavor);
});

askFlavor = function(response, convo) {
  convo.ask("What flavor of pizza do you want?", function(response, convo) {
    convo.say("Awesome.");
    askSize(response, convo);
    convo.next();
  });
}
askSize = function(response, convo) {
  convo.ask("What size do you want?", function(response, convo) {
    convo.say("Ok.")
    askWhereDeliver(response, convo);
    convo.next();
  });
}
askWhereDeliver = function(response, convo) { 
  convo.ask("So where do you want it delivered?", function(response, convo) {
    convo.say("Ok! Good by.");
    convo.next();
  });
}
```



## Working with the Smooch API

A bot's "api" property contains an initialized instance of [smooch-core](https://github.com/lemieux/smooch-core-js). You can use this to access any of the API methods available in the [Smooch REST API](http://docs.smooch.io/rest/).

You can use the API methods to set and retrieve user profile information and more.


