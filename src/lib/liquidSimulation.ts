import Matter from 'matter-js';

export class LiquidSimulation {
  private engine: Matter.Engine;
  private render: Matter.Render;
  private mouse: Matter.Mouse;
  private runner: Matter.Runner;
  private mouseConstraint: Matter.MouseConstraint;
  private particles: Matter.Body[] = [];
  private draggableObjects: Matter.Body[] = [];
  private leftHandBody: Matter.Body;
  private rightHandBody: Matter.Body;
  private particleOpacity: number = 0;
  private fadeInStartTime: number = 0;
  private maxVelocity: number = 15; // Threshold for max velocity color
  
  constructor(private container: HTMLElement) {
    // Create engine
    this.engine = Matter.Engine.create();
    this.setupEngine();
    
    // Create renderer
    this.render = Matter.Render.create({
      element: container,
      engine: this.engine,
      options: {
        fps: 60,
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2), // Cap pixel ratio
        background: '#1a1a1a',
        showSleeping: false,
        showDebug: false,
        showBroadphase: false,
        showBounds: false,
        showVelocity: false,
        showCollisions: false,
        showSeparations: false,
        showAxes: false,
        showPositions: false,
        showAngleIndicator: false,
        showIds: false,
        showVertexNumbers: false,
        showConvexHulls: false,
        showInternalEdges: false
      }
    });
    
    // Add mouse control
    this.mouse = Matter.Mouse.create(this.render.canvas);
    this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });
    
    Matter.Composite.add(this.engine.world, this.mouseConstraint);
    
    // Create hand bodies
    this.leftHandBody = Matter.Bodies.circle(0, 0, 50, {
      isStatic: true,
      isSleeping: false,
      sleepThreshold: Infinity,
      render: {
        fillStyle: 'rgba(0, 255, 0, 0.3)',
        strokeStyle: '#00FF00',
        lineWidth: 2
      },
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001
      }
    });
    
    this.rightHandBody = Matter.Bodies.circle(0, 0, 50, {
      isStatic: true,
      isSleeping: false,
      sleepThreshold: Infinity,
      render: {
        fillStyle: window.innerWidth < 768 ? 'transparent' : 'rgba(0, 255, 0, 0.3)', 
        strokeStyle: window.innerWidth < 768 ? 'transparent' : '#00FF00',
        lineWidth: window.innerWidth < 768 ? 0 : 2
      },
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001
      }
    });
    
    Matter.Composite.add(this.engine.world, [this.leftHandBody, this.rightHandBody]);
    
    // Create boundaries
    this.createBoundaries();
    
    // Create initial particles
    this.createParticles();

    // Create draggable objects
    this.createDraggableObjects();
    
    // Add window resize handler
    window.addEventListener('resize', this.handleResize);
    
    // Optimize render performance
    this.render.options.wireframes = false;
    this.render.options.showShadows = false;
    
    // Use requestAnimationFrame for smoother rendering
    this.runner = Matter.Runner.create({
      isFixed: true,
      delta: 1000 / 60,
      isFixed: true,
      interpolate: true
    });
    
    Matter.Runner.run(this.runner, this.engine);
    Matter.Render.run(this.render);

    // Add velocity color update to engine update event
    Matter.Events.on(this.engine, 'afterUpdate', this.updateParticleColors);

    // Start fade in animation
    this.fadeInStartTime = Date.now();
    this.animateFadeIn();
  }
  
  private updateParticleColors = () => {
    this.particles.forEach(particle => {
      if (!particle.render) return;
      
      const velocity = Math.sqrt(
        particle.velocity.x * particle.velocity.x + 
        particle.velocity.y * particle.velocity.y
      );
      
      // Normalize velocity and clamp between 0 and 1
      const normalizedVelocity = Math.min(velocity / this.maxVelocity, 1);
      
      // Create a color gradient from blue to red based on velocity
      const hue = (1 - normalizedVelocity) * 180; // 180 (cyan) to 0 (red)
      const saturation = 100;
      const lightness = 50 + normalizedVelocity * 20; // Brighter at higher velocities
      
      particle.render.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
  };
  
  private animateFadeIn = () => {
    const elapsed = Date.now() - this.fadeInStartTime;
    const duration = 4000; // 4 seconds fade in
    
    this.particleOpacity = Math.min(1, elapsed / duration);
    
    // Update all particles opacity
    this.particles.forEach(particle => {
      if (particle.render) {
        particle.render.opacity = this.particleOpacity;
      }
    });
    
    if (this.particleOpacity < 1) {
      requestAnimationFrame(this.animateFadeIn);
    }
  };
  
  public updateHandPosition(handIndex: number, x: number, y: number) {
    const handBody = handIndex === 0 ? this.leftHandBody : this.rightHandBody;
    
    // Keep hand bodies "awake" by applying tiny random force
    Matter.Body.applyForce(handBody, handBody.position, {
      x: (Math.random() - 0.5) * 0.0001,
      y: (Math.random() - 0.5) * 0.0001
    });
    
    // Add velocity-based movement for smoother interaction
    const currentPos = handBody.position;
    const dx = x - currentPos.x;
    const dy = y - currentPos.y;
    
    // Apply smooth movement with velocity
    Matter.Body.setVelocity(handBody, {
      x: dx * 1.2,
      y: dy * 1.2
    });
    
    // Update position
    Matter.Body.setPosition(handBody, {
      x: x,
      y: y
    });
  }
  
  private createBoundaries() {
    const walls = [
      Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true }), // bottom
      Matter.Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true }), // left
      Matter.Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true }), // right
    ];
    
    Matter.Composite.add(this.engine.world, walls);
  }
  
  private setupEngine() {
    // Optimize engine configuration
    this.engine.enableSleeping = false; // Prevent particles from going to sleep
    this.engine.timing.timeScale = 0.9; // Slightly reduce simulation speed for better stability
    this.engine.constraintIterations = 2;
    this.engine.positionIterations = 6; // Balanced for performance and accuracy
    this.engine.velocityIterations = 4; // Balanced for performance and accuracy
  }
  
  private createParticles() {
    // Create hexagon vertices
    const hexagonRadius = 16;
    const isMobile = window.innerWidth < 768;
    const hexagonVertices = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      hexagonVertices.push({
        x: hexagonRadius * Math.cos(angle),
        y: hexagonRadius * Math.sin(angle)
      });
    }

    const particleOptions = {
      friction: 0.1,
      restitution: 0.2,
      density: 0.001, // Slightly increased for better stability
      slop: 0.01, // Further reduced slop for even tighter collisions
      sleepThreshold: Infinity, // Prevent particles from sleeping
      chamfer: { radius: 2 }, // Smooth corners for better collision handling
      collisionFilter: {
        category: 0x0001,
        mask: 0x0003 // Collide with walls (0x0001) and hands (0x0002)
      },
      render: {
        fillStyle: 'transparent',
        strokeStyle: '#ffffff',
        lineWidth: 2,
        opacity: 0 // Start with 0 opacity
      }
    };
    
    // Create particles in a grid pattern for more stable initial state
    const rows = isMobile ? 12 : 30;
    const cols = isMobile ? 15 : 40;
    const spacing = 45; // Further increased spacing between particles
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (window.innerWidth / 2 - (cols * spacing) / 2) + col * spacing;
        const y = 50 + row * spacing;
        
        const jitter = Math.random() * 2 - 1; // Reduced jitter for more organized layout
        
        const particle = Matter.Bodies.fromVertices(
          x + jitter,
          y + jitter,
          hexagonVertices,
          particleOptions
        );
        
        this.particles.push(particle);
      }
    }
    
    // Add some random particles for more natural behavior
    for (let i = 0; i < (isMobile ? 50 : 200); i++) {
      const particle = Matter.Bodies.fromVertices(
        window.innerWidth / 2 + Math.random() * 300 - 150,
        50 + Math.random() * 100,
        hexagonVertices,
        particleOptions
      );
      
      this.particles.push(particle);
    }
    
    Matter.Composite.add(this.engine.world, this.particles);
  }
  
  private createDraggableObjects() {
    // Removed draggable objects
  }
  
  private handleResize = () => {
    this.render.canvas.width = window.innerWidth;
    this.render.canvas.height = window.innerHeight;
    Matter.Render.setPixelRatio(this.render, window.devicePixelRatio);
  };
  
  public destroy() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
    Matter.Composite.clear(this.engine.world, false);
    this.render.canvas.remove();
    window.removeEventListener('resize', this.handleResize);
  }
}