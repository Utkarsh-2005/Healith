"use client";

import { ThemeProvider } from "../context/ThemeContext";

export default function MeditationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
