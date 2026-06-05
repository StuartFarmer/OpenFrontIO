import React from "react";
import { describe, expect, it } from "vitest";
import { FoundationDynamicsPageComponent } from "../../../../src/games/foundation/dynamics/react";

describe("FoundationDynamicsPageComponent", () => {
  it("exposes the Lit dynamics page as a React component wrapper", () => {
    const element = React.createElement(FoundationDynamicsPageComponent);

    expect(element.type).toBe(FoundationDynamicsPageComponent);
  });
});
