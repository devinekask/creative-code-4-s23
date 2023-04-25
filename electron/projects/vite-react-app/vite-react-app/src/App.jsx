import { useRef, useState } from "react";
import Slider from "./components/Slider";

const App = () => {

  const hasWebSerial = "serial" in navigator;
  const [isConnected, setIsConnected] = useState(false);
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
  const writer = useRef(null);

  const handleClickConnect = async () => {
    const port = await navigator.serial.requestPort();
    console.log(port);
    const info = port.getInfo();
    console.log(info);
    await connect(port);
  };

  const connect = async (port) => {
    setIsConnected(true);
    await port.open({ baudRate: 9600 });

    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer.current = textEncoder.writable.getWriter();

    port.addEventListener("disconnect", () => {
      setIsConnected(false);
    });
  };

  const handleColorChange = async newColor => {
    setColor(newColor);
    if (isConnected && writer.current) {
      await writer.current.write(JSON.stringify(newColor));
      await writer.current.write("\n");
    }
  };

  if (!hasWebSerial) return <div>Web Serial is not supported</div>
  if (!isConnected) return <div><button onClick={handleClickConnect}>Connect</button></div>

  return <div>
    <div>
      <Slider label="Red" min={0} max={255} value={color.r} onValueChange={(value) => handleColorChange({ ...color, r: value })} />
    </div>
    <div>
      <Slider label="Green" min={0} max={255} value={color.g} onValueChange={(value) => handleColorChange({ ...color, g: value })} />
    </div>
    <div>
      <Slider label="Blue" min={0} max={255} value={color.b} onValueChange={(value) => handleColorChange({ ...color, b: value })} />
    </div>
  </div>
};

export default App;