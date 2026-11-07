import React from "react";
import { Composition } from "remotion";
import { FPS, HouseXDemo, TOTAL } from "./Demo";

export const Root: React.FC = () => (
  <Composition id="HouseXDemo" component={HouseXDemo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
