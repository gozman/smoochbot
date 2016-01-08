/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    _______..___  ___.   ______     ______     ______  __    __  .______     ______   .___________.
    /       ||   \/   |  /  __  \   /  __  \   /      ||  |  |  | |   _  \   /  __  \  |           |
   |   (----`|  \  /  | |  |  |  | |  |  |  | |  ,----'|  |__|  | |  |_)  | |  |  |  | `---|  |----`
    \   \    |  |\/|  | |  |  |  | |  |  |  | |  |     |   __   | |   _  <  |  |  |  |     |  |     
.----)   |   |  |  |  | |  `--'  | |  `--'  | |  `----.|  |  |  | |  |_)  | |  `--'  |     |  |     
|_______/    |__|  |__|  \______/   \______/   \______||__|  |__| |______/   \______/      |__|     
                                                                                                    
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('./lib/Botkit.js')
var os = require('os');

console.log(process.env);

var controller = Botkit.smoochbot({
    debug: true,
    appToken:process.env.APPTOKEN,
    key:process.env.KEY,
    secret:process.env.SECRET,
    incoming_webhook:{url:process.env.INCOMING_WEBHOOK},
    bot_name:process.env.BOT_NAME,
    avatar_url:process.env.AVATAR_URL
});

var bot = controller.spawn()

bot.configureIncomingWebhook();
controller.startTicking();

controller.setupWebserver(process.env.PORT, function(err, server) {
  controller.createWebhookEndpoints(server);
});

controller.hears(['hello','hi','sup','yo','hey'],'message_received',function(bot,message) {
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }

    if(!user) {
      user = {
        id: message.user,
      }
    }

    if(user && !(user.email)) {
      bot.startConversation(message, askEmail);
    } else {
      console.log(bot);
      bot.startConversation(message, askArea);
    }
  });
})

controller.hears(['call me (.*)'],'message_received',function(bot,message) {
  var matches = message.text.match(/call me (.*)/i);
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. I will call you " + user.name + " from now on.");
    })
  })
});

controller.hears(['what is my name','who am i', 'what\'s my name'],'message_received',function(bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});

controller.hears(['uptime','identify yourself','who are you','what is your name'],'message_received',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,'I am a bot named SmoochBot I have been running for ' + uptime + ' on ' + hostname + ".");

});

var askEmail = function(response, convo) {
  console.log(convo);

  convo.ask("Before we begin, can you please give me your e-mail address, this way someone from my team can get back to you if they're not around right now?", function(response, convo) {

    console.log(response);
    controller.storage.users.get(response.user,function(err,user) {
      if (!user) {
        user = {
          email: response.text,
        }
      }
      user.email = response.text;
      controller.storage.users.save(user,function(err,id) {
        convo.say("Awesome");
      });
    });

    askArea(response,convo);
    convo.next();
  });
}

var askArea = function(response, convo) {
  convo.ask("Do you have a technical question?", [
    {
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
        convo.say('Cool, one of my @engineers will be able to help you if I can\'t');
        askPlatform(response,convo);
        convo.next();
      }
    },
    {
      pattern: bot.utterances.no,
      default: true,
      callback: function(response, convo) {
        convo.say('*Phew!* I still haven\'t had any coffee and my circuits are a little rusty. One of my human friends from our @biz team will lend a hand in a few.');
        convo.next();
      }
    }
    ]);
}

var askPlatform = function(response, convo) {
  convo.ask("What platform are you working with, iOS, Android, Web, or API?", function(response, convo) {  
    convo.say("Thanks, I've alterted our @engineers - they'll be around in a jiffy.");
    convo.next();
  });
}

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}
