# Hand Lab 🖐️

An interactive web application that demonstrates real-time hand tracking with fluid physics simulation. Wave your hands to interact with dynamic liquid particles in your browser!

[Live Demo](https://hand-lab.netlify.app/)

<img src="./public/media/demo-final.gif" alt="Demo" width="800" />

## Features

- Real-time hand tracking using MediaPipe
- Fluid physics simulation with Matter.js
- Responsive design for both desktop and mobile
- Dynamic particle effects with velocity-based coloring
- Smooth hand interaction with natural physics

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Matter.js (Physics Engine)
- MediaPipe Hands (Hand Tracking)
- Lucide React (Icons)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A modern web browser
- Webcam access

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the local server URL

## Usage

1. Allow camera access when prompted
2. Wait for the hand tracking to initialize
3. Use your hands in front of the camera to interact with the particles:
   - Desktop: Use both hands to create interesting fluid effects
   - Mobile: Use one hand for simplified interaction

## Performance Tips

- Ensure good lighting for optimal hand tracking
- Keep your hands within the camera frame
- For best performance, use a device with a good camera and GPU

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for the hand tracking technology
- [Matter.js](https://brm.io/matter-js/) for the physics engine
- [Vite](https://vitejs.dev/) for the build tooling