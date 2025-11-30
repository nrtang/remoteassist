# Remote Assistance Console for Autonomous Vehicles

A React-based interface for remote operators to monitor and control autonomous vehicles during interventions.

## Features

### 🚗 Vehicle Monitoring
- **Active Intervention Queue**: Real-time list of vehicles requiring assistance
- **Priority Levels**: High/Medium/Low priority color coding
- **Context Awareness**: Passenger onboard, waiting, or empty vehicle status
- **Live Camera Feeds**: Switch between front, rear, left, right, and interior cameras

### 🎮 Control Modes

#### 1. Draw Path Mode
- Click on the video feed to place waypoints
- Create a custom route for the vehicle to follow
- Visual path with numbered waypoints

#### 2. Nudge Mode
Quick micro-commands for the vehicle:
- Pull Over Safely
- Proceed Slowly (5 mph)
- Wait for Clear Signal
- Resume Normal Speed
- Move Left/Right 2 feet

#### 3. Relocate Pickup
- Click on the map to set a new pickup location
- Useful for pickup location mismatches
- Updates passenger pin in real-time

### 🗺️ Fleet Mode
Make map changes that affect ALL vehicles in the fleet:
- Mark Road Closed
- Report Hazard (slow zone)
- Construction Zone (reduced speed)
- Requires confirmation before applying

### 📊 UI Layout
- **Left Panel (20%)**: Intervention queue
- **Center Stage (60%)**: Video feed + live map
- **Right Panel (20%)**: Control interface

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

This will start a local server (usually at `http://localhost:5173`). Open your browser and navigate to that URL.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Select a Ticket**: Click on any intervention in the left queue
2. **Choose Control Scope**: Toggle between Vehicle (single) or Fleet (all vehicles)
3. **Select Intervention Mode**: Draw Path, Nudge, or Relocate Pickup
4. **Choose Reason**: Select the incident reason from the dropdown
5. **Execute**: The "Send Command" button activates when ready

## Scenarios Included

The demo includes several pre-configured scenarios:
- **Pickup Location Mismatch**: Passenger can't find vehicle
- **Construction Zone**: Route blocked by construction
- **Event Closure**: Marathon blocking streets
- **Traffic Merge**: Vehicle waiting to merge safely

## Technology Stack

- **React 18**: UI framework
- **Lucide React**: Icon library
- **Vite**: Build tool and dev server

## Project Structure

```
remoteassist/
├── src/
│   ├── RemoteAssistanceConsole.jsx  # Main component
│   └── main.jsx                      # Entry point
├── index.html                        # HTML template
├── vite.config.js                    # Vite configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## Notes

This is a UI prototype/demo. In a production environment, you would need:
- Backend API integration for real vehicle data
- WebRTC or WebSocket connections for live camera feeds
- Authentication and authorization
- Real-time fleet management system integration
- Logging and audit trails
- Multi-operator coordination
