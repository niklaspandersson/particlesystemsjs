import React from "react";
import "./Navigation.scss";
import { Thumbnail } from "./Thumbnail";

type Props = {
  demos: string[];
  onSelectDemo(demo:string):void;
}

export const Navigation: React.FC<Props> = ({ demos, onSelectDemo }) => {
  return <div id="navigation">
    <ul>
      {demos.map(d => <li key={d} className="demo" onClick={() => onSelectDemo(d)}><button><Thumbnail title={d} thumbUrl={`thumbs/${d}.png`} /></button></li>)}
    </ul>
  </div>
}