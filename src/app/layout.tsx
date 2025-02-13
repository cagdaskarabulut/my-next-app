"use client";

import "./globals.css";
import React, { ReactNode } from "react";

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <head>{/* Başlık ve meta etiketleri */}</head>
      <body>{children}</body>
    </html>
  );
};

export default Layout;
