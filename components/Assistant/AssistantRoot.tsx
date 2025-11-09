"use client";
import React from "react";
import AtlasPanel from "./AtlasPanel";
import AssistantButton from "./AssistantButton";
import { AssistantProvider } from "./AssistantProvider";

export default function AssistantRoot() {
  return (
    <AssistantProvider>
      <AssistantButton />
      <AtlasPanel />
    </AssistantProvider>
  );
}
