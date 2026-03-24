import type { Metadata } from "next";

import { PinEntry } from "./pin-entry";

export const metadata: Metadata = {
  title: "Enter PIN",
};

export default function PinPage() {
  return <PinEntry />;
}
