// Transcribed from the supplied résumé; only PDF line wrapping is normalized.
// Private contact details are deliberately excluded.
export const projectRecords = [
  {
    id: '001',
    title: 'Progressive Autonomous Driving Simulator',
    technologies: 'Python, Highway-env, Gymnasium, NumPy',
    dates: 'Oct 2026 – Present',
    status: 'IN PROGRESS',
    bullets: [
      'Building a repeatable 50-scenario test harness for autonomous driving in highway-env (Python)',
      'Lane-keeping baseline collided in 50 of 50 scenarios at 29 m/s average speed, setting the benchmark for later stages',
      'Training a reinforcement-learning driving policy (stable-baselines3, CPU-only) with a collision penalty, and will compare it with rule-based controllers on 50 held-out highway scenarios (In Progress)',
    ],
  },
  {
    id: '002',
    title: 'EVE',
    technologies: 'Python, JavaScript, CSS, Shell, Makefile, HTML',
    dates: 'Jun 2026',
    status: 'PROJECT',
    bullets: [
      'Collaborated with a peer to build a voice-activated personal AI assistant with real-time speech recognition, LLM integration, and text-to-speech capabilities',
      'Contributed to the speech-to-text and text-to-speech pipeline, integrating the faster-whisper library',
    ],
  },
  {
    id: '003',
    title: 'Bare-Metal GPIO Project',
    technologies: 'C, ARM Assembly, Linker Script, Makefile',
    dates: 'Jun 2026 – Aug 2026',
    status: 'PROJECT',
    bullets: [
      'Built a bare-metal C and ARM assembly program on a Raspberry Pi 5 to execute low-level GPIO control without an underlying operating system',
      'Authored custom linker scripts and startup assembly routines to manage memory mapping and vector tables directly on hardware',
      'Interfaced directly with system registers to configure memory-mapped I/O, clock controls, and register-level execution',
    ],
  },
  {
    id: '004',
    title: 'Navigating Autonomous Vehicles with Humans Research Proposal',
    technologies: '',
    dates: 'Aug 2025 – Dec 2025',
    status: 'RESEARCH PROPOSAL',
    bullets: [
      'Authored an independent research proposal on improving AV-human driver interaction safety across merging, non-signalized intersections, and lane-changing scenarios',
      'Proposed a novel simulation framework using edge-case scenarios to address key limitations in existing game-theoretic AV decision-making models',
    ],
  },
] as const
