# CrowdWatch - IoT Crowd Monitoring System

CrowdWatch is a comprehensive React-based dashboard designed for real-time crowd monitoring and analytics. It serves as the frontend interface for an IoT-based Stall Monitoring System, visualizing data captured by ESP32-CAM modules to help identifying engaging stalls, improving event planning, and managing crowd safety.

## 🚀 Features

- **Live Monitor (Dashboard)**: Real-time visualization of crowd density across different zones (e.g., Main Entrance, Food Court).
- **Analytics Module**: Historical data tracking with interactive charts for visitor trends and peak hours.
- **Image Processing**: Manual upload feature for processing crowd images using custom algorithms.
- **System Status**: Live status monitoring of connected IoT devices (ESP32-CAMs).
- **Settings & Alerts**: Configurable thresholds for crowd density alerts and system notifications.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📂 Project Structure

```bash
app_stall_montior-22/
├── crowdwatch-app/          # Main React Application
│   ├── src/
│   │   ├── pages/           # Application Routes (Dashboard, Analytics, etc.)
│   │   ├── components/      # Reusable UI Components
│   │   ├── Layout.js        # Main App Layout with Sidebar
│   │   └── App.js           # Main Entry Point & Routing
│   └── package.json         # Dependencies & Scripts
└── Components/              # Shared/External Components
```

## ⚡ Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1.  Navigate to the application directory:
    ```bash
    cd crowdwatch-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

Start the development server:

```bash
npm start
```

The application will launch automatically at `http://localhost:3000`.

## 📸 Screenshots

will be updated 
## 🔧 Configuration

Navigate to the **Settings** page within the application to configure:
- Maximum capacity thresholds per zone.
- Alert sensitivity.
- Device connection parameters.

## 📄 License

This project is part of the Stall Monitoring System research initiative.
