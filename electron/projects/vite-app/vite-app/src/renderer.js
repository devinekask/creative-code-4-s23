/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

// app state
const hasWebSerial = "serial" in navigator;
let isConnected = false;

const $notSupported = document.getElementById("not-supported");
const $supported = document.getElementById("supported");
const $notConnected = document.getElementById("not-connected");
const $connected = document.getElementById("connected");

const $connectButton = document.getElementById("connectButton");

const arduinoInfo = {
  usbProductId: 32823,
  usbVendorId: 9025
};
let connectedArduinoPorts = [];

let writer;
const $r = document.getElementById("r");
const $g = document.getElementById("g");
const $b = document.getElementById("b");

const init = async () => {
  displaySupportedState();
  if (!hasWebSerial) return;
  displayConnectionState();
  navigator.serial.addEventListener('connect', (e) => {
    const port = e.target;
    const info = port.getInfo();
    console.log('connect', port, info);
    if (isArduinoPort(port)) {
      connectedArduinoPorts.push(port);
      if (!isConnected) {
        connect(port);
      }
    }
  });

  navigator.serial.addEventListener('disconnect', (e) => {
    const port = e.target;
    const info = port.getInfo();
    console.log('disconnect', port, info);
    connectedArduinoPorts = connectedArduinoPorts.filter(p => p !== port);
  });

  const ports = await navigator.serial.getPorts();
  connectedArduinoPorts = ports.filter(isArduinoPort);

  console.log('Ports');
  ports.forEach(port => {
    const info = port.getInfo();
    console.log(info);
  });
  console.log('Connected Arduino ports');
  connectedArduinoPorts.forEach(port => {
    const info = port.getInfo();
    console.log(info);
  });

  if (connectedArduinoPorts.length > 0) {
    connect(connectedArduinoPorts[0]);
  }

  $connectButton.addEventListener("click", handleClickConnect);

  $r.addEventListener("input", handleInput);
  $g.addEventListener("input", handleInput);
  $b.addEventListener("input", handleInput);
};

const isArduinoPort = (port) => {
  const info = port.getInfo();
  return info.usbProductId === arduinoInfo.usbProductId && info.usbVendorId === arduinoInfo.usbVendorId;
};

const handleClickConnect = async () => {
  const port = await navigator.serial.requestPort();
  console.log(port);
  const info = port.getInfo();
  console.log(info);
  await connect(port);
};

const connect = async (port) => {
  isConnected = true;
  displayConnectionState();

  await port.open({ baudRate: 9600 });

  const textEncoder = new TextEncoderStream();
  const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
  writer = textEncoder.writable.getWriter();

  port.addEventListener("disconnect", () => {
    console.log("Disconnected");
    isConnected = false;
    displayConnectionState();
  });
}

const handleInput = async () => {
  const r = parseInt($r.value);
  const g = parseInt($g.value);
  const b = parseInt($b.value);
  if (!isConnected) {
    return;
  }
  await writer.write(JSON.stringify({
    r,
    g,
    b,
  }));
  await writer.write("\n");
};

const displaySupportedState = () => {
  if (hasWebSerial) {
    $notSupported.style.display = "none";
    $supported.style.display = "block";
  } else {
    $notSupported.style.display = "block";
    $supported.style.display = "none";
  }
}

const displayConnectionState = () => {
  if (isConnected) {
    $notConnected.style.display = "none";
    $connected.style.display = "block";
  } else {
    $notConnected.style.display = "block";
    $connected.style.display = "none";
  }
}

init();