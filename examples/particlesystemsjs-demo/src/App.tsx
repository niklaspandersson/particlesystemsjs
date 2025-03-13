import React from 'react';
import './App.scss';
import { Navigation } from './components/Navigation';
//import { Bubbles } from "./demos/bubbles";
import { IDemo } from './demos/demo';
import { createDemo } from './demos';

const demos = ["bubbles", "explosion", "confetti", "dust", "onevent"];

function App() {
  const scene = React.useRef<HTMLCanvasElement|undefined>();
  const currentDemo = React.useRef<IDemo|undefined>();
  const [showDummyContent, setShowDummyContent] = React.useState(false);
  
  React.useEffect(() => {
    function handler() {
      if(scene.current) {
        scene.current.height = scene.current.clientHeight;
        scene.current.width = scene.current.clientWidth;
      }
    }

    handler();
    window.addEventListener("resize", handler);
    
    return () => window.removeEventListener("resize", handler);
  }, []);

  function selectDemo(demo:string) {
    //stop previous
    currentDemo.current?.stop?.();

    currentDemo.current = createDemo(demo) || undefined;
    setShowDummyContent(!!currentDemo.current?.start(scene.current!))
    
  }
  
  return (
    <div className="app">
      <header className="header">
        <h1>ParticlesystemsJS - Demos</h1>
      </header>
      <Navigation demos={demos} onSelectDemo={selectDemo} />
      <canvas ref={el => scene.current = (el || undefined)} id="scene" />
      { showDummyContent && <div className="content">
        <h2>This is a spectacular header</h2>
        <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. <button id="btn-test">Click me to test</button> Sequi sapiente fugit voluptatibus vero dignissimos mollitia alias distinctio, numquam amet est veritatis corporis iure tempora sunt minima vel deserunt! Minima, voluptate?</p>
        <h2>This is another header</h2>
        <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sequi sapiente fugit voluptatibus vero dignissimos mollitia alias distinctio, numquam amet est veritatis corporis iure tempora sunt minima vel deserunt! Minima, voluptate?</p>
      </div>}
    </div>
  );
}

export default App;
