# SpoofDPI UI (Stable v1.2.1)

A modern, beautiful desktop application for **SpoofDPI**, an anti-censorship tool designed to bypass Deep Packet Inspection (DPI) by manipulating network traffic.

This project is a graphical interface for the excellent [xvzc/SpoofDPI](https://github.com/xvzc/SpoofDPI) project.

![App Screenshot](https://raw.githubusercontent.com/xvzc/SpoofDPI/main/docs/assets/logo.png)

## ✨ Features

- **One-Click Proxy:** Start and stop the SpoofDPI service with a single button.
- **Modern Dashboard:** Real-time status indicator and connection summary.
- **DNS Options:** Toggle between standard UDP and DNS-over-HTTPS (DoH).
- **Setup Guide:** Integrated instructions for configuring Firefox and other browsers.
- **Live Logs:** Monitor intercepted traffic and DPI bypass activity.

## 🚀 Getting Started

### Download
Grab the latest **AppImage** from the [Releases](https://github.com/Elias966/spoofdpi-ui/releases) page.

### Usage
1.  **Run the AppImage:**
    ```bash
    chmod +x spoofdpi-ui.AppImage
    ./spoofdpi-ui.AppImage
    ```
2.  **Start Proxy:** Click the "Start Proxy" button.
3.  **Configure Browser:**
    - Open **Firefox Settings** → **Network Settings**.
    - Select **Manual proxy configuration**.
    - HTTP Proxy: `127.0.0.1`, Port: `8080`.
    - Check **"Also use this proxy for HTTPS"**.

## 🛠️ Built With
- **Backend:** Electron (Node.js) + [SpoofDPI v1.2.1 Stable Binary](https://github.com/xvzc/SpoofDPI)
- **Frontend:** React + TypeScript + Vite
- **Icons:** Lucide React

## 📄 License
This UI wrapper is released under the MIT License. The core SpoofDPI binary is licensed under the Apache-2.0 License by [xvzc](https://github.com/xvzc).

---
**Disclaimer:** This is an independent UI wrapper. All credit for the DPI bypass logic goes to the original author of [SpoofDPI](https://github.com/xvzc/SpoofDPI).
