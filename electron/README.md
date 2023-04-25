# Electron

In this chapter we will learn how to use Electron to build cross-platform desktop applications with JavaScript, HTML, and CSS.

## What is Electron?

Electron is a framework for creating native applications with web technologies like JavaScript, HTML, and CSS.

There are many different ways to build an application. Some of the reasons why we're choosing Electron are:

- **Easy to learn** - If you know how to build a website, you already know how to build a desktop application with Electron. The APIs are the same and the language is HTML, CSS, and JavaScript.
- **Native APIs** - Electron is built on top of Chromium and Node.js, so you can access the full power of modern JavaScript and use hundreds of modules from the Node.js ecosystem directly from your application.
- **Cross-platform** - Electron uses web technologies to create native applications. You can write your application once using technologies that you already know and love and build it for Mac, Windows, and Linux.

## Create our first project with Electron Forge

We're going to use [Electron Forge](https://www.electronforge.io) to create our first Electron application. Electron Forge is a complete tool for creating, publishing, and installing modern Electron applications.

Open your terminal and run the following command to generate a basic Electron project:

```bash
npm init electron-app@latest basic-app
```

cd into that directory and run the following command to start the application:

```bash
npm start
```

You should see a window pop up with the text "Hello, World!".

### Project Structure

There are at least two processes running in Electron: the main process and the renderer process. The main process is responsible for creating the browser window and managing the application lifecycle. The renderer process is responsible for displaying the HTML and managing the user interface.

The project structure looks like this (only the important files are shown)

```bash
basic-app/
├── src
│   ├── index.html
│   └── index.js
├── package.json
```

Take a look at the index.js file. This is the entry point of the application (aka the main process). This index.js file isn't loaded by the browser. It is loaded by Node.js and launches the electron browser window (the index.html, which is the renderer process).

### Web Serial

Let's try to use the Web Serial API in our Electron application. Hook up an RGB led as seen in the [Arduino Chapter](../arduino/).

Upload the [Arduino Sketch to control the RGB Led via JSON messages over the serial port](../arduino/projects/arduino-web-serial-rgbled/arduino/).

Replace the entire body tag with the body tag from the [sliders.html](../arduino/projects/arduino-web-serial-rgbled/web/public/sliders.html) file into the index.html file of your Electron project.

Run the project. You'll get an error when trying to connect to the serial port:

> caught (in promise) DOMException: Failed to execute 'requestPort' on 'Serial': No port selected by the user.

In order to access the serial port, we'll have to allow access to that port in the main process of our Electron app.

Open up the `index.js` file (which is the main process) and hook up an event handler which will be called when the renderer wants access to a serial port:

```diff
const mainWindow = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
});

+ const handleSelectSerialPort = (event, portList, webContents, callback) => {
+   console.log('select-serial-port FIRED WITH', portList);

+   event.preventDefault()
+   const arduino = portList.find(port => port.displayName && port.displayName.toLowerCase().includes('arduino'))
+   if (arduino) {
+     callback(arduino.portId)
+   } else {
+     callback('') //Could not find any matching devices
+   }
+ };

+ mainWindow.webContents.session.on('select-serial-port', handleSelectSerialPort);

+ mainWindow.on('close', () => {
+   mainWindow.webContents.session.removeListener('select-serial-port', handleSelectSerialPort);
+ });

// and load the index.html of the app.
mainWindow.loadFile(path.join(__dirname, 'index.html'));
```

Run the app again. It should now work.

### Create a stand-alone build

You can create a stand-alone build of your Electron app by running the following command:

```bash
npm run package
```

This generates a stand-alone executable in the `out` folder of your project.

## Electron & Vite

It's also possible to generate a project with Vite support. This is useful if you want to use bundling, hot module reloading, or frameworks like React.

Create a new folder for this project, and run the command to generate an electron project with Vite support:

```bash
npm init electron-app@latest vite-app -- --template=vite
```

There are a couple of small differences in this project structure. The name of the main process file is src/main.js. You'll also see that the index.html includes a script tag that loads renderer.js. This is the entry point of the renderer process.

Modify the project, so that the RGB led project works in this structure. Some points of attention:

- The main process is now in src/main.js
- Make sure your javascript code ends up in src/renderer.js. Don't use an inline script anymore.

## Adding React

Finally, let's see how we can add React to our Electron project. It might be usefull to open one of your previous React (web) projects, as we'll copy some code from there.

Starting with an Electron + Vite project, we'll add the react plugin to the vite config file for our renderer. Open up vite.renderer.config.mjs, and replace it with the following contents:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});

```

Initialize a basic React app in the renderer.js file:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div>Hello World</div>
  </React.StrictMode>,
)
```

Try running the app. You'll get an error:

> Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react'

We still need to add a couple of packages to our project. Run the following 2 commands to install them:

```bash
npm install -D @vitejs/plugin-react @types/react @types/react-dom
```

```bash
npm install react react-dom
```

Try running the app again. You'll now get an error, complaining about JSX code inside of a file with the .js extension:

> [plugin:vite:import-analysis] Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.

Rename the renderer.js file to renderer.jsx and update the script tag in index.html to load renderer.jsx instead of renderer.js.

Launch the app again, we're now getting a different error in our web console:

> Uncaught Error: Minified React error #299; visit https://reactjs.org/docs/error-decoder.html?invariant=299 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
 
This is because we're using the production build of React, which doesn't include the error messages. Launch the app with the following command to use the development build of React:

```bash
NODE_ENV=development npm start
```

The error is now a little bit more clear:

> Uncaught Error: createRoot(...): Target container is not a DOM element.

This is because we're trying to render our React app into a div with the id 'root', but that div doesn't exist in our index.html file. Update the body tag in index.html to include a div with the id 'root':

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/renderer.jsx"></script>
</body>
```

Our React + Vite project template is now up and running.