# Quick URL Shortener & QR Code Generator

A robust full-stack link shortening service built with Cloudflare Workers (for high-performance API) and a modern, localized frontend. Includes a custom browser extension for instant link creation.

### 🌐 Live Service & Architecture
The entire service is deployed and running at: [**short.berkk.cloud**](https://short.berkk.cloud)

This project is a high-performance URL shortening service built using a monorepo structure to integrate a fast, serverless Cloudflare Worker API with a dedicated client-side frontend and a cross-browser extension.

## 🚀 Key Features

* **Instant Shortening:** Converts long URLs into short, unique keys (e.g., `s.berkk.cloud/KEY`).
* **Custom Slugs:** Allows users to define their own unique, memorable short link (e.g., `s.berkk.cloud/my-project`).
* **Time To Live (TTL):** All links are automatically deleted from the KV database after 7 days.
* **QR Code Generation:** Generates a corresponding QR code for every shortened link.
* **Cross-Browser Extension:** Dedicated extension for Chrome/Firefox/Edge.
* **Localization:** Supports English (EN) and Turkish (TR) languages on the main site.

## 💻 Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend / API** | **Cloudflare Workers** (JavaScript) | Handles high-speed POST/GET requests and manages KV storage. |
| **Database** | **Cloudflare KV Storage** | Stores URL mappings with built-in TTL expiration. |
| **Frontend / Site** | Vanilla JavaScript, Tailwind CSS | Provides the main, responsive, localized shortening interface. |
| **Extension** | Manifest V3 (Cross-Browser) | Reads active tab URL and communicates via JSON to the API. |

---

## 📸 Demo & Screenshots

### 1. Website Homepage
<img width="2560" height="1355" alt="Screenshot 2025-11-22 at 17-36-05 URL Shortener   QR Code" src="https://github.com/user-attachments/assets/d9ec1a29-8c4c-4906-92cb-096adc57e507" />

### 2. Shortening Result & QR Code
<img width="2560" height="1355" alt="Screenshot 2025-11-22 at 17-37-50 URL Shortener   QR Code" src="https://github.com/user-attachments/assets/b0a60236-ddee-471d-bcd4-76ef36501a55" />

### 3. Cross-Browser Extension Popup
<img width="344" height="233" alt="image" src="https://github.com/user-attachments/assets/acf181d8-bf1e-40ab-b0b8-2acd5b94b0f0" />

---
