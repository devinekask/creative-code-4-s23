# Websockets

In this chapter we're going to cover real-time data communication.

There are walk-through videos available on our Canvas Learning Platform where we go through this material & exercises step-by-step.

# Intro

Up until today, you've been writing javascript applications which have been executing mostly on the client. If you wanted to load data from a server, you would use a `fetch` call, wait for an answer from the server and handle the server's response. 

But what if you wanted to get real-time data? An endless loop of fetches doesn't seem such a good idea performance-wise. Luckely, there is a way to keep an open connection and receive new data in our app as soon as it's available: (web)sockets.

(Web)sockets will allow us synchronize data / variables in real time between multiple clients connected to a central server. This data could be anything: text messages for a chat application, mouse positions for a collaborative drawing app or the position of a player in a multi-user game.

Most programming languages have built-in support for sockets. This way, you can link multiple programs and systems to eachother. Now, a socket connection is just one part of the picture, the programs must conform to a given set of rules: a protocol. When you write your own software, you can make this up yourself or use an existing protocol.

In javascript land, we will use Websockets. There have been a couple of versions of the Websocket protocol, but luckely you don't really have to worry about this, as this will be handled by the browser and the socket library you'll be using. Once the connection is made, it's up to you to decide on the format you want to use for data transfer. A logical choice would be sending JSON formatted messages back and forth.

You've probably already used web apps who are working with websockets: Facebook chat, Slack, a live reload server or a browser experience you control using your smartphone.

![collage of different websocket applications](images/websockets-applications.png)

Make sure to [bookmark the MDN documentation on Websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

## Getting real time crypto trades

As a first exercise we'll connect to an existing websocket service. Take a look at [the implementation using AJAX calls](projects/p01-bitstamp-ajax).

Every 10 seconds, this page will do an AJAX fetch to get the latest transaction from bitstamp:

```javascript
const poll = async () => {
  const data = await (await fetch(apiUrl)).json();
  $h1.innerHTML = `1 BTC = ${data.bpi.EUR.rate} EUR`;
  setTimeout(() => poll(), 10000);
};
```

There are a couple of problems with this implementation:

1. You might miss on transactions if multiple transations happen within that 10 second timeframe
2. You might do unnecessary calls to bitstamp when no transations happened.

Let's improve this with websockets! Note: we can switch to websockets in this particular example as Bitstamp offers a websocket service. Not all apis offer a websocket implementation.

First of all, you'll need to make a websocket connection to bitstamp:

```javascript
const webSocketUrl = `wss://ws.bitstamp.net`;
const socket = new WebSocket(webSocketUrl);
```

Once a connection is made, Bitstamp expects you to send a "subscription" message to their websocket service. You can [read more about their api in the bitstamp docs](https://www.bitstamp.net/websocket/v2/).

You'll need to detect 2 things on this websocket object:

1. Detect when the connection is opened
2. Detect incoming messages

Try [finding out on the MDN Websocket docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) how you can do this by yourself, before continuing with this exercise.

### Detecting a connection

You're able to detect a connection, using the "open" event:

```javascript
socket.addEventListener(`open`, event => {
  console.log(`Socket open`);
}
```

Within that open handler, you'll send the subscription message to bitstamp:

```javascript
const msg = {
  event: "bts:subscribe",
  data: {
    channel: "live_trades_btcusd"
  }
};
socket.send(JSON.stringify(msg));
```

### Listening for incoming data

You'll need to listen for incoming data as well, in order to visualize the trades.

Listen for message events on the socket and parse the incoming string:

```javascript
socket.addEventListener(`message`, event => {
  const data = JSON.parse(event.data);
});
```

Log the data object and explore how you can display the latest trade info on the page. If you're stuck, you can [look at the solution](projects/p02-bitstamp-websockets) to compare 🙂.

## Building a chat app

We'll be using the [socket.io](https://socket.io) library on both our client and nodejs server. There are a couple of benefits in using socket.io:

- it handles serialization and deserialization, no need to do JSON encodes / decodes yourself.
- you can send different "message types" aka "events" between server and client. Native websockets just have "message" events where you need to add your own protocol to send different kinds of messages.
- it has concepts such as rooms and namespaces to group connections together

As a first exercise with socket.io, we'll build a basic chat application.

### Express

We'll use the express application framework as a basis of our nodejs server. Create a new project folder, and add the express framework to it's dependencies:

```bash
npm init -y
npm install express
```

Create an index.js file in the project root, where you start a basic express server:

```javascript
const express = require('express')
const app = express()
const port = 3000

app.use(express.static('public'))
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
```

Add a start script to your package.json which executes the index.js file

```json
"scripts": {
  "start": "node index.js"
},
```

And run `npm start` to launch the node app. Navigating to http://localhost:3000 should give you a 404-error from express:

![screenshot of a 404 error](images/your-own-server-404.png)

So, how can you host files from your express app? If you [take a look at the docs](https://expressjs.com/en/starter/static-files.html) you'll see that there is an `express.static(root, [options])` middleware you can use.

Create a folder called `public` in your project root, and link the middleware to your express instance:

```javascript
app.use(express.static('public'));
```

Inside that public folder, you'll create an index.html file. Just leave it empty for now and restart the node server. You should be able to see your html file when navigating to http://localhost

### Listening for websocket connections

Next up, we'll need to handle websocket connections to our server. Add socket.io as a dependency to your project:

```
npm install socket.io
```

Looking at the documenation at https://socket.io/get-started/chat#integrating-socketio we'll add socket.io to the mix.

add a couple of module initialisations after `const app = express()`:

```javascript
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
```

Change `app.listen` into `server.listen`:

```javascript
server.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
```

Next up, add an event listener to handle websocket connections:

```javascript
io.on('connection', socket => {
  console.log('connection');
}); 
```

### Creating a socket.io connection on the client

Back to our HTML. Create a basic form, and load the socket.io library:

```html
<form id="msgForm" method="post" action="">
  <input id="msgInput" type="text" name="msgInput" />
  <button type="submit">Send Message</button>
</form>
<script src="/socket.io/socket.io.js"></script>
```

Create variables to hold the form, input and the socket connections, and provide an `init()` function (empty for now):

```javascript
const $msgForm = document.getElementById('msgForm');
const $msgInput = document.getElementById('msgInput');

let socket; // will be assigned a value later

const init = () => {

};
init();
```

In this init function, you'll connect to the server. You can just use a forward slash, as our socket server address is the same as our web server domain.

```javascript
socket = io.connect(`/`);
socket.on(`connect`, () => {
  console.log(`Connected: ${socket.id}`);
});
```

Test the app. You should see the "connected" message in your javascript Console.

### Listening for messages on the server

Once we've got a connection set up, we want to send messages between the clients and the server.

Let's listen for `message` events on our server and log them:

```javascript
io.on('connection', socket => {
  console.log(`Connection`);
  socket.on(`message`, message => {
    console.log(`Received message: ${message}`);
  });
});
```

### Sending messages to the server

Next up, we'll use the form to send a message to the server. Listen for the "submit" event on the form:

```javascript
$msgForm.addEventListener(`submit`, e => handleSubmit(e));
```

and in the submit handler, you'll send a message with the socket. If everything works as it should, you should see your messages appear in the server console! Don't forget to restart your server for changes to take effect.

```javascript
const handleSubmit = e => {
  e.preventDefault();
  if (socket.connected) {
    socket.emit(`message`, $msgInput.value);
  }
  $msgInput.value = ``;
};
```

### Forwarding messages

The server needs to forward the message from a client to all connected clients. This way you can display everybody's messages in your app.

![schema showing message sent to server get broadcasted back](images/messages-client-server.png)

There's an easy way to do this in socket.io: using `io.sockets.emit()` you can broadcast a message to everyone. (Check out the [socket.io emit cheat sheet for other options](https://socket.io/docs/v4/emit-cheatsheet/)) Use the same event type as a first parameter, and pass in the incoming message object:

```javascript
socket.on(`message`, message => {
  console.log(`Received message: ${message}`);
  io.sockets.emit(`message`, message);
});
```


### Handling messages from the server

In our client code, we'll need to listen for these message events on your socket object. Hook up an event listener in your `init()` function:

```javascript
socket.on(`message`, message => {
  console.log(`Received message: ${message}`);
});
```

Note that this code is identical to the code you had on the server!

Test the app again. You should see all's messages appear in your console.

Finally: add a textarea to the page and append the incoming messages to the textarea. This way you don't need to have your devtools open, which is more useful for an end user 😉. You can [take a peek at the solution](projects/p03-simple-chat) if you're stuck.

If you open up a second browser window, you should see the messages from one window appear in all windows. As a final test, you can try connecting to the server from another device on the same WiFi: use your ip-address instead of localhost. Use <kbd>option</kbd> + click on your wifi icon to view your ip address. You might want to disable your firewall in your Security & Privacy settings.

Note that the `message` event type is something we chose ourselves. In your own apps, you can choose whichever event type you like (except from some built in types such as `connect`, `ping`, `pong`, ...)

## Chat app with nicknames

All our messages in the previous app are anomymous. Let's require our users to enter a unique nickname as well.

Next to the `message` event from the previous project, we'll add a second socket.io event `name` to send our name over.

Add a second form to the app to enter a name:

```html
<form id="nameForm" method="post" action="">
  <input id="nameInput" type="text" name="nameInput" placeholder="your name" />
  <button type="submit">Connect</button>
</form>
```

Get a reference to this form and add a listener for the submit event:

```javascript
// add this to the top
const $nameForm = document.getElementById('nameForm');
const $nameInput = document.getElementById('nameInput');
// ...

// listen for the submit event in the init function
$nameForm.addEventListener('submit', e => handleSubmitName(e));

// ...

// and send the name over in the submit handler
const handleSubmitName = e => {
  e.preventDefault();
  socket.emit('name', $nameInput.value);
};
```

### Linking a name to the socket

On the server side, we'll need to link the name to a connected socket. To do so, we'll create a lookup object where we use the socket ids as a key.

Initialize this lookup object at the top level of your nodejs code:

```javascript
const clients = {};
```

When a client connects, create a value in this lookup object for the given socket. You'll do this in the existing `connection` event:

```javascript
io.on('connection', socket => {
  clients[socket.id] = { id: socket.id };

  // ...

}
```

When a `name` event arrives through the socket, store it in the lookup object:

```javascript
socket.on('name', name => {
  console.log('name', name);
  // TODO: name validation
  clients[socket.id].name = name;
  // send the name back as a confirmation
  socket.emit('name', name);
});
```

Update the message event handler so that every time a message arrives, we send the metadata of the sender when forwarding the message:

```javascript
socket.on('message', message => {
  if (!clients[socket.id].name) {
    // no name? no forward!
    return;
  }
  console.log('message', message);
  io.sockets.emit(`message`, clients[socket.id], message);
});
```

Finally, make sure to delete the client data from the lookup object, when the socket disconnects:

```javascript
socket.on('disconnect', () => {
  delete clients[socket.id];
});
```

### Finalizing the client app

Right now, our client app is broken. After entering a name, we can send a message. However: we're no longer seeing the messages, but `[Object object]` instead.

Try to figure out what's going on by using your console.log skills and looking at the modified server code.

You might have noticed that we're getting two parameters on the message event: the associated client data AND the message. Modify your code, so you're seeing the name of the sender as well:

```javascript
socket.on('message', (sender, message) => {
  console.log(`<${sender.name}> ${message}`);
  $messages.value += `<${sender.name}> ${message}\n`;
});
```

There are still a couple of opportunities to improve the app:

- Validation of the name on the server side: it needs to be a string with at least one character AND needs to be unique
- Two screen ui: show the name input on startup and show the chat screen after validating your name on the server.

As always, you can [look at the solution for inspiration](projects/p04-chat-with-names).

## Shared cursors app

Real-time shared data can be more than chat messages. In our next app, we'll be sharing our cursor coordinates through a websocket server.

![multiple cursors moving accross the screen](images/shared-cursors.gif)

### Writing the server

First up is writing the server.

Create a new node project, with express and socket.io. Host a static directory, with an index.html file. We'll implement this file in a later step.

Our server will do a little more than just forwarding messages. It will keep track of some state data: the x and y positions of each connected client.

In the server app, you'll store the x and y positions per connected client in a global object. Create a global variable to store this information:

```javascript
const clients = {};
```

Every time a client connects, you'll add information to this clients object for that client's socket id:

```javascript
clients[socket.id] = {
  id: socket.id,
  x: Math.random(),
  y: Math.random()
};
```

Listen to the update event of that new socket connection, and update the x and y positions to the new positions:

```javascript
socket.on('update', data => {
  clients[socket.id].x = data.x;
  clients[socket.id].y = data.y;
});
```

When a user disconnects, you'll need to remove the related data from the global object. This is as easy as using the `delete` keyword:

```javascript
socket.on('disconnect', () => {
  console.log('client disconnected');
  delete clients[socket.id];
});
```

Finally, we'll broadcast the global users object to all connected clients,with a given interval. Start that interval once the server starts, and it should automatically sync the users object to all clients:

```javascript
server.listen(port, () => {
 console.log(`App listening on port ${port}!`);
 setInterval(() => {
    io.sockets.emit('update', clients);
  }, 100);
});
```

### Shared cursors client

Up to the html part.

In your `init()` function, create a socket connection and add an event listener to the `mousemove` event:

```javascript
socket = io.connect('/');
window.addEventListener(`mousemove`, e => handleMouseMove(e));
```

In your `handleMouseMove` listener, you'll send an `update` event to the server, with the relative mouse position as it's payload:

```javascript
const handleMouseMove = e => {
  if (socket.connected) {
    socket.emit(`update`, {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    });
  }
};
```

The server will broadcast cursor positions to all connected clients. This way, you can visualise them in your own client app.

First of all, add a listener for the `update` event on your socket connection:

```javascript
socket.on(`update`, clients => {
  console.log(clients);
});
```

Reload the browser. You should see an incoming object, containing unique ids and coordinates:

```javascript
{
  Sstf83sdx28FU1ZOAAAA: {
    id: "Sstf83sdx28FU1ZOAAAA"
    x: 0.058486238532110095
    y: 0.4036363636363636
  },
  j2jqcHWkBUnj7OB1AAAF: {
    id: "j2jqcHWkBUnj7OB1AAAF"
    x: 0.9962616822429906
    y: 0.38545454545454544
  }
}
```

We will loop through these users with a `for ... in... ` loop, and move a div-block accordingly. We can use the unique ids as an id for the div-block, and create a new div if it doesn't exist yet:

```javascript
for(let clientId in clients) {
  let $cursor = document.querySelector(`#cursor-${clientId}`);
  if(!$cursor) {
    $cursor = document.createElement(`div`);
    $cursor.classList.add(`cursor`);
    $cursor.setAttribute(`id`, `cursor-${clientId}`);
    document.body.appendChild($cursor);
  }
  $cursor.style.left = `${clients[clientId].x * window.innerWidth}px`;
  $cursor.style.top = `${clients[clientId].y * window.innerHeight}px`;
}
```

Add some basic styling for those cursor divs:

```css
.cursor {
  position: absolute;
  width: 1rem;
  height: 1rem;
  margin-left: -.5rem;
  margin-right: -.5rem;
  background: red;
  border-radius: 50% 50%;
  transition: top .1s, left .1s;
}
```

Test the app. You should see red circles move accross the screen!

### Removing old cursors

Right now, when a client disconnect, it's cursor will remain on your screen. You'll need to remove that div from the DOM.

In the `update` event, you'll only get the connected clients. By comparing the list of ids with the previous list of ids, you can check which clients are no longer present.

First of all, create a global variable called `socketIds`. Initialize it as an empty Array:

```javascript
let socketIds = [];
```

In the update handler, store the new socket ids in a const. You can get the keys from the `clients` object, by using the `Object.keys(...)` method:

```javascript
const currentSocketIds = Object.keys(clients);
```

Get a list of the disconnected clients, by filtering out the socketIds from the previous update which are not present in the currentSocketIds.

```javascript
const disconnectedSocketIds = socketIds.filter(clientId => {
  return currentSocketIds.indexOf(clientId) === -1;
});
```

Loop through these socket ids, and remove the corresponding div block from the DOM:

```javascript
disconnectedSocketIds.forEach(clientId => {
  const $cursor = document.querySelector(`#cursor-${clientId}`);
  if($cursor) {
    $cursor.parentNode.removeChild($cursor);
  }
});
```

Finally, set the global `socketIds` variable equal to the `currentSocketIds` so you can compare them in the next call.

```javascript
socketIds = currentSocketIds;
```

Test the app, using multiple windows. When you close a window, it's corresponding cursor should disappear from your other windows.

## One to one communcation

One of the applications of websockets, is using your smartphone as an extra input control of a web experience. For this to work, you need to set up a communication channel between the smartphone, server and your desktop browser.

Instead of a server which broadcasts messages to all connected clients, the server will need to messages it receives from your smartphone to your smartphone. For this to work, your smartphone and desktop apps need to know eachother's socket ids.

![schema showing one to one communication](images/messages-one-on-one.png)

### Communication structure

We'll have two different apps:

1. A desktop app, connecting to the server
2. A mobile app, connecting to the server, with knowledge of the desktop id

When starting up the mobile part, we'll need to input the desktop id some how. As a quick and easy way, we'll pass the desktop id in the querystring of the mobile page:

| **Desktop**        | **Remote**                 |
|--------------------|----------------------------|
| index.html         | controller.html?id=abc123  |
| socket ID: abc123  | socket ID: xyz987          |

With every message of our remote to the server, we will pass the socket id of the corresponding desktop app as well.

### Server app

Create new Express + socket.io server project, with a static directory for your html files.

This will be a pretty basic socket server, which will send update events to a target user. In the previous app, our message handlers received a message type and a payload (e.g. `update` and `data`). This server app will expect an additional parameter, the target socket id. This is used to forward the incoming payload to just one target socket id (instead of broadcasting it to all sockets).

```javascript
const users = {};

io.on('connection', socket => {
  console.log(`Connection`);
  users[socket.id] = {
    id: socket.id
  };
  socket.on('update', (targetSocketId, data) => {
    if (!users[targetSocketId]) {
      return; // do nothing
    }
    // forward the update to that particular user
    socket.to(targetSocketId).emit('update', data);
  });
  socket.on('disconnect', () => {
    console.log('client disconnected');
    delete users[socket.id];
  });  
});
```

### Desktop client

The desktop page will show a ball, which we'll control using a seperate controller client. We will send update events with x and y coordinates.

Create a new html page, with one div, with class `cursor` (cfr previous exercise). We'll just show this one cursor, no other clients (because we are building a one-to-one application).

Listen for the `update` event, and adjust the position of the `cursor` based on the incoming data:

```javascript
socket.on(`update`, (data) => {
  $cursor.style.left = `${data.x * window.innerWidth}px`;
  $cursor.style.top = `${data.y * window.innerHeight}px`;
});
```

To make things a little easier for the next app we'll build (the controller), we'll display the socket id on the page as wel. Add a DOM element to the page, reference it in your javascript code, and display the url with socket id for the controller, when the socket connects:

```javascript
socket.on(`connect`, () => {
  let url = `${new URL(`/controller.html?id=${socket.id}`, window.location)}`;
  $url.textContent = url;
});
```

### Controller client

Create a second html page. This page expects the target socket id (aka a socket id of a desktop page) to be in the querystring. We will check for this first:

```javascript
let socket, targetSocketId;

const init = () => {
  targetSocketId = getUrlParameter(`id`);
  if (!targetSocketId) {
    alert(`Missing target ID in querystring`);
    return;
  }
};

const getUrlParameter = name => {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

init();
```

Create a socket connection at the end of the init function. Listen for a `mousemove` and / or `touchmove` event on the window object, and send the event object's coordinates to the server, including the targetSocketId:

```javascript
window.addEventListener(`mousemove`, e => {
  socket.emit(`update`, targetSocketId, {
    x: e.clientX / window.innerWidth,
    y: e.clientY / window.innerHeight
  });
});
window.addEventListener(`touchmove`, e => {
  socket.emit(`update`, targetSocketId, {
    x: e.touches[0].clientX / window.innerWidth,
    y: e.touches[0].clientY / window.innerHeight
  });
});
```

Open the desktop page in one window and the controller page in another window. Make sure to include the id displayed in the desktop page in the querystring. You should be able to move the cursor from the controller page.

If you want to test control from an external device, you'll need to connect with the IP address of your server. E.g. http://192.168.0.100:8080/controller.html?id=C4wHK_3R27HtDpjDAAAA

### QR Code

Typing the entire URL, including the id is a bit annoying on a smartphone. In this case, scanning a QR code might be a bit easier.

Include the [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) library in your desktop.html:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
```

Add a div which will contain the qr code:

```html
<div id="qr"></div>
```

When the socket connects, we'll show the URL with a QR code:

```javascript
const typeNumber = 4;
const errorCorrectionLevel = 'L';
const qr = qrcode(typeNumber, errorCorrectionLevel);
qr.addData(url);
qr.make();
document.getElementById('qr').innerHTML = qr.createImgTag(4);
```

Load the desktop page. Make sure to load it with your computer's ip address (instead of localhost), that way the QR code will contain the ip address in it's url.

## Where to go from here

- Try building a link between an arcade javascript game and your smartphone as controller.
- Use your smartphone's [gyroscope as an input](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent).
