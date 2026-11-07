import React from "react";
import { Composition } from "remotion";
import { FPS, HouseXDemo, TOTAL } from "./Demo";
import { FPS30, HouseX30, TOTAL30 } from "./Demo30";

export const Root: React.FC = () => (
  <>
    <Composition id="HouseX30" component={HouseX30} durationInFrames={TOTAL30} fps={FPS30} width={1920} height={1080} />
    <Composition id="HouseXDemo" component={HouseXDemo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
  </>
);
