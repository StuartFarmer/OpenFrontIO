import { createComponent } from "@lit/react";
import React from "react";
import { FoundationDynamicsPage } from "../../client/FoundationDynamicsPage";

export const FoundationDynamicsPageComponent = createComponent({
  tagName: "foundation-dynamics-page",
  elementClass: FoundationDynamicsPage,
  react: React,
  events: {},
});
