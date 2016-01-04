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

controller.setupWebserver(3000, function(err, server) {
  controller.createWebhookEndpoints(server);
});

controller.hears(['hello','hi','sup','yo','hey'],'message:appUser',function(bot,message) {
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }
  });
})

controller.hears(['call me (.*)'],'message:appUser',function(bot,message) {
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

controller.hears(['what is my name','who am i', 'what\'s my name'],'message:appUser',function(bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});


controller.hears(['shutdown'],'message:appUser',function(bot,message) {

  bot.startConversation(message,function(err,convo) {
    convo.ask("Are you sure you want me to shutdown?",[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say("Bye!");
          convo.next();
          setTimeout(function() {
            process.exit();
          },3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default:true,
        callback: function(response,convo) {
          convo.say("*Phew!*");
          convo.next();
        }
      }
    ])
  })
})


controller.hears(['uptime','identify yourself','who are you','what is your name'],'message:appUser',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':robot_face: I am a bot named SmoochBot I have been running for ' + uptime + ' on ' + hostname + ".");

})

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
