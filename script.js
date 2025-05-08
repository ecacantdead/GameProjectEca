import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";

// Game state
const gameState = {
  playerScore: 0,
  computerScore: 0,
  round: 1,
  isGameOver: false,
  soundEnabled: true,
  choices: ["rock", "paper", "scissors"],
  playerChoice: null,
  computerChoice: null,
  gameHistory: [],
  sceneReady: false,
};

// DOM Elements
const loadingScreen = document.getElementById("loading-screen");
const progressBar = document.querySelector(".progress");
const storyIntro = document.getElementById("story-intro");
const storyTexts = document.querySelectorAll(".story-text");
const startGameBtn = document.getElementById("start-game");
const gameContainer = document.getElementById("game-container");
const playerScoreEl = document.getElementById("player-score");
const computerScoreEl = document.getElementById("computer-score");
const roundNumberEl = document.getElementById("round-number");
const gameStatusEl = document.getElementById("game-status");
const choiceBtns = document.querySelectorAll(".choice-btn");
const resetGameBtn = document.getElementById("reset-game");
const toggleSoundBtn = document.getElementById("toggle-sound");
const toggleFullscreenBtn = document.getElementById("toggle-fullscreen");
const resultModal = document.getElementById("result-modal");
const roundResultEl = document.getElementById("round-result");
const playerChoiceEl = document.getElementById("player-choice");
const computerChoiceEl = document.getElementById("computer-choice");
const resultMessageEl = document.getElementById("result-message");
const nextRoundBtn = document.getElementById("next-round");
const gameOverModal = document.getElementById("game-over-modal");
const finalResultEl = document.getElementById("final-result");
const finalPlayerScoreEl = document.getElementById("final-player-score");
const finalComputerScoreEl = document.getElementById("final-computer-score");
const finalMessageEl = document.getElementById("final-message");
const playAgainBtn = document.getElementById("play-again");
const gameScene = document.getElementById("game-scene");

// 3D Scene Setup
let scene, camera, renderer, controls;
let rockMesh, paperMesh, scissorsMesh;

// Audio
const audioFiles = {
  background: new Audio("/sounds/bg.mp3"),
  click: new Audio("/sounds/click.mp3"),
  win: new Audio("/sounds/win.mp3"),
  lose: new Audio("/sounds/lose.mp3"),
  draw: new Audio("/sounds/draw.mp3"),
};

// Atur audio background untuk loop
audioFiles.background.loop = true;

// Initialize the game
function init() {
  // Langsung selesaikan loading
  progressBar.style.width = "100%";

  // Langsung tampilkan story intro setelah 1 detik
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
    storyIntro.classList.remove("hidden");
    animateStoryText();
  }, 1000);

  // Setup 3D scene
  setupScene();

  // Tambahkan event listeners
  addEventListeners();
}

// Animate story text
function animateStoryText() {
  storyTexts.forEach((text, index) => {
    setTimeout(() => {
      text.style.opacity = "1";
      text.style.transform = "translateY(0)";
    }, index * 800);
  });

  // Show start button after all text is displayed
  setTimeout(() => {
    startGameBtn.style.opacity = "1";
    startGameBtn.style.transform = "scale(1)";
  }, storyTexts.length * 800 + 500);
}

// Setup 3D scene
function setupScene() {
  try {
    // Inisialisasi scene
    scene = new THREE.Scene();

    // Inisialisasi camera
    camera = new THREE.PerspectiveCamera(
      75,
      gameScene.clientWidth / gameScene.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 1;

    // Inisialisasi renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(gameScene.clientWidth, gameScene.clientHeight);
    renderer.setClearColor(0x000000, 0);

    // Tambahkan renderer ke DOM
    gameScene.appendChild(renderer.domElement);

    // Inisialisasi controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;

    // Tambahkan cahaya
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Buat arena
    createArena();

    // Buat objek game
    createGameObjects();

    // Tangani resize window
    window.addEventListener("resize", onWindowResize);

    // Mulai animasi
    animate();

    // Tandai scene sebagai siap
    gameState.sceneReady = true;

    // Tambahkan petunjuk visual untuk kontrol
    addControlsHelper();
  } catch (error) {
    console.error("Error setting up Three.js scene:", error);
  }
}

// Tambahkan petunjuk visual untuk kontrol
function addControlsHelper() {
  // Tambahkan teks petunjuk
  const helpText = document.createElement("div");
  helpText.className = "controls-helper";
  helpText.innerHTML = `
    <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white; font-size: 14px; pointer-events: none;">
      <p>🖱️ Klik dan geser untuk memutar kamera</p>
      <p>⚙️ Scroll untuk zoom in/out</p>
    </div>
  `;
  gameScene.appendChild(helpText);

  // Tambahkan petunjuk animasi
  const animationHelper = document.createElement("div");
  animationHelper.className = "animation-helper";
  animationHelper.innerHTML = `
    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white; font-size: 14px; pointer-events: none;">
      <p>🏆 Pemenang akan naik ke atas</p>
      <p>🥈 Yang kalah akan turun ke bawah</p>
    </div>
  `;
  gameScene.appendChild(animationHelper);
}

// Create arena
function createArena() {
  // Buat platform lingkaran
  const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    metalness: 0.8,
    roughness: 0.2,
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = -0.5;
  scene.add(platform);

  // Tambahkan efek glow pada platform
  const platformEdgeGeometry = new THREE.TorusGeometry(3, 0.1, 16, 100);
  const platformEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a11cb,
    emissive: 0x6a11cb,
    emissiveIntensity: 0.5,
  });
  const platformEdge = new THREE.Mesh(
    platformEdgeGeometry,
    platformEdgeMaterial
  );
  platformEdge.rotation.x = Math.PI / 2;
  platformEdge.position.y = -0.4;
  scene.add(platformEdge);

  // Tambahkan partikel latar belakang
  createParticles();
}

// Create particles
function createParticles() {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 500;

  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i += 3) {
    // Posisikan partikel dalam bentuk bola
    const radius = 15 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i + 2] = radius * Math.cos(phi);
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.2,
    color: 0x2575fc,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Animasikan partikel
  gsap.to(particlesMesh.rotation, {
    y: Math.PI * 2,
    duration: 100,
    repeat: -1,
    ease: "none",
  });
}

// Create game objects (rock, paper, scissors)
function createGameObjects() {
  // BATU: Gunakan geometri yang lebih jelas dan lebih besar
  const rockGroup = new THREE.Group();

  // Buat batu utama (lebih besar dan lebih jelas)
  const rockMainGeometry = new THREE.IcosahedronGeometry(0.8, 1);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.3,
    roughness: 0.8,
  });
  const rockMain = new THREE.Mesh(rockMainGeometry, rockMaterial);
  rockGroup.add(rockMain);

  // Tambahkan beberapa tonjolan untuk membuat batu terlihat lebih realistis
  for (let i = 0; i < 5; i++) {
    const bumpGeometry = new THREE.IcosahedronGeometry(0.3, 1);
    const bump = new THREE.Mesh(bumpGeometry, rockMaterial);

    // Posisikan tonjolan secara acak di sekitar batu utama
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.6;

    bump.position.x = r * Math.sin(phi) * Math.cos(theta);
    bump.position.y = r * Math.sin(phi) * Math.sin(theta);
    bump.position.z = r * Math.cos(phi);

    bump.scale.set(0.5, 0.5, 0.5);
    rockGroup.add(bump);
  }

  rockGroup.position.set(-2, 0, 0);
  rockGroup.userData = { type: "rock" };
  rockMesh = rockGroup;
  scene.add(rockGroup);

  // Tambahkan label untuk batu
  addLabel(rockGroup, "BATU", -2, -1.2, 0);

  // KERTAS: Buat kertas yang lebih jelas
  const paperGroup = new THREE.Group();

  // Buat kertas utama
  const paperGeometry = new THREE.BoxGeometry(1.2, 0.05, 1.5);
  const paperMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
  });
  const paperMain = new THREE.Mesh(paperGeometry, paperMaterial);
  paperGroup.add(paperMain);

  // Tambahkan garis-garis pada kertas
  const lineGeometry = new THREE.BoxGeometry(1.0, 0.06, 0.05);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000088 });

  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.y = 0.03;
    line.position.z = -0.6 + i * 0.3;
    paperGroup.add(line);
  }

  paperGroup.position.set(0, 0, 0);
  paperGroup.userData = { type: "paper" };
  paperMesh = paperGroup;
  scene.add(paperGroup);

  // Tambahkan label untuk kertas
  addLabel(paperGroup, "KERTAS", 0, -1.2, 0);

  // GUNTING: Buat gunting yang lebih jelas
  const scissorsGroup = new THREE.Group();

  // Buat bilah gunting
  const bladeGeometry = new THREE.ConeGeometry(0.15, 1, 32);
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.8,
    roughness: 0.2,
  });

  const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade1.rotation.x = Math.PI / 2;
  blade1.position.set(0, 0, 0.3);

  const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade2.rotation.x = Math.PI / 2;
  blade2.position.set(0, 0, -0.3);

  // Buat pegangan gunting
  const handleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 32);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.5,
  });

  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.rotation.x = Math.PI / 2;

  // Buat lingkaran untuk pegangan jari
  const ringGeometry = new THREE.TorusGeometry(0.2, 0.05, 16, 32);
  const ring1 = new THREE.Mesh(ringGeometry, handleMaterial);
  ring1.position.set(0, 0, 0.5);
  ring1.rotation.y = Math.PI / 2;

  const ring2 = new THREE.Mesh(ringGeometry, handleMaterial);
  ring2.position.set(0, 0, -0.5);
  ring2.rotation.y = Math.PI / 2;

  scissorsGroup.add(blade1);
  scissorsGroup.add(blade2);
  scissorsGroup.add(handle);
  scissorsGroup.add(ring1);
  scissorsGroup.add(ring2);

  scissorsGroup.position.set(2, 0, 0);
  scissorsGroup.userData = { type: "scissors" };
  scissorsMesh = scissorsGroup;
  scene.add(scissorsGroup);

  // Tambahkan label untuk gunting
  addLabel(scissorsGroup, "GUNTING", 2, -1.2, 0);

  // Animasikan objek game
  animateGameObjects([rockMesh, paperMesh, scissorsMesh]);
}

// Tambahkan label teks 3D
function addLabel(object, text, x, y, z) {
  // Buat div untuk label
  const labelDiv = document.createElement("div");
  labelDiv.className = "object-label";
  labelDiv.textContent = text;
  labelDiv.style.position = "absolute";
  labelDiv.style.color = "white";
  labelDiv.style.padding = "5px 10px";
  labelDiv.style.background = "rgba(0,0,0,0.7)";
  labelDiv.style.borderRadius = "5px";
  labelDiv.style.fontWeight = "bold";
  labelDiv.style.fontSize = "16px";
  labelDiv.style.pointerEvents = "none";

  // Tambahkan ke game scene
  gameScene.appendChild(labelDiv);

  // Perbarui posisi label pada setiap frame
  object.userData.label = labelDiv;
  object.userData.labelPosition = new THREE.Vector3(x, y, z);
}

// Update posisi label
function updateLabels() {
  // Perbarui posisi semua label
  scene.children.forEach((obj) => {
    if (obj.userData && obj.userData.label && obj.userData.labelPosition) {
      const position = obj.userData.labelPosition.clone();
      position.project(camera);

      const x = (position.x * 0.5 + 0.5) * gameScene.clientWidth;
      const y = (-position.y * 0.5 + 0.5) * gameScene.clientHeight;

      obj.userData.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    }
  });
}

// Animate game objects
function animateGameObjects(objects) {
  objects.forEach((obj, index) => {
    // Animasi mengambang yang lebih lambat dan jelas
    gsap.to(obj.position, {
      y: 0.5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: index * 0.5,
    });

    // Animasi rotasi yang lebih lambat
    gsap.to(obj.rotation, {
      y: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: "none",
    });

    // Tambahkan efek highlight saat hover
    obj.userData.originalScale = { x: 1, y: 1, z: 1 };

    // Tambahkan efek pulsing untuk menarik perhatian
    gsap.to(obj.scale, {
      x: 1.05,
      y: 1.05,
      z: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: index * 0.3,
    });
  });
}

// Handle window resize
function onWindowResize() {
  if (!camera || !renderer || !gameScene) return;

  camera.aspect = gameScene.clientWidth / gameScene.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(gameScene.clientWidth, gameScene.clientHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (controls) controls.update();
  if (renderer && scene && camera) {
    updateLabels();
    renderer.render(scene, camera);
  }
}

// Add event listeners
function addEventListeners() {
  // Start game button
  startGameBtn.addEventListener("click", () => {
    playSound("click");
    storyIntro.classList.add("hidden");
    gameContainer.classList.remove("hidden");

    // Pastikan scene 3D dirender dengan benar
    setTimeout(() => {
      onWindowResize();
    }, 100);

    // Putar musik latar belakang
    if (gameState.soundEnabled) {
      audioFiles.background.play().catch((err) => {
        console.log("Background music error:", err);
      });
    }
  });

  // Choice buttons
  choiceBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      playSound("click");
      const choice = btn.id;
      playRound(choice);
    });
  });

  // Reset game button
  resetGameBtn.addEventListener("click", () => {
    playSound("click");
    resetGame();
  });

  // Toggle sound button
  toggleSoundBtn.addEventListener("click", () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    toggleSoundBtn.textContent = gameState.soundEnabled ? "🔊" : "🔇";

    if (gameState.soundEnabled) {
      audioFiles.background.play().catch((err) => {
        console.log("Background music error:", err);
      });
    } else {
      audioFiles.background.pause();
    }
  });

  // Toggle fullscreen button
  toggleFullscreenBtn.addEventListener("click", () => {
    playSound("click");
    toggleFullscreen();
  });

  // Next round button
  nextRoundBtn.addEventListener("click", () => {
    playSound("click");
    resultModal.classList.add("hidden");
    gameState.round++;
    updateUI();
  });

  // Play again button
  playAgainBtn.addEventListener("click", () => {
    playSound("click");
    gameOverModal.classList.add("hidden");
    resetGame();
  });
}

// Play a round
function playRound(playerChoice) {
  // Get player and computer choices
  gameState.playerChoice = playerChoice;
  gameState.computerChoice = getComputerChoice();

  // Determine winner
  const result = determineWinner(
    gameState.playerChoice,
    gameState.computerChoice
  );

  // Update scores
  if (result === "win") {
    gameState.playerScore++;
    playSound("win");
  } else if (result === "lose") {
    gameState.computerScore++;
    playSound("lose");
  } else {
    playSound("draw");
  }

  // Add to game history
  gameState.gameHistory.push({
    round: gameState.round,
    playerChoice: gameState.playerChoice,
    computerChoice: gameState.computerChoice,
    result: result,
  });

  // Show result
  showResult(result);

  // Check if game is over
  if (gameState.playerScore >= 5 || gameState.computerScore >= 5) {
    gameState.isGameOver = true;
    showGameOver();
  }
}

// Get computer choice
function getComputerChoice() {
  const randomIndex = Math.floor(Math.random() * gameState.choices.length);
  return gameState.choices[randomIndex];
}

// Determine winner
function determineWinner(playerChoice, computerChoice) {
  if (playerChoice === computerChoice) {
    return "draw";
  }

  if (
    (playerChoice === "rock" && computerChoice === "scissors") ||
    (playerChoice === "paper" && computerChoice === "rock") ||
    (playerChoice === "scissors" && computerChoice === "paper")
  ) {
    return "win";
  }

  return "lose";
}

// Show result
function showResult(result) {
  // Update result modal
  if (result === "win") {
    roundResultEl.textContent = "Kamu Menang!";
    roundResultEl.style.color = "var(--success-color)";
  } else if (result === "lose") {
    roundResultEl.textContent = "Kamu Kalah!";
    roundResultEl.style.color = "var(--danger-color)";
  } else {
    roundResultEl.textContent = "Seri!";
    roundResultEl.style.color = "var(--neutral-color)";
  }

  // Update choice icons
  playerChoiceEl.textContent = getChoiceEmoji(gameState.playerChoice);
  computerChoiceEl.textContent = getChoiceEmoji(gameState.computerChoice);

  // Update result message
  resultMessageEl.textContent = getResultMessage(
    gameState.playerChoice,
    gameState.computerChoice,
    result
  );

  // Show modal
  resultModal.classList.remove("hidden");

  // Animate 3D scene
  animateResult(result);
}

// Get choice emoji
function getChoiceEmoji(choice) {
  switch (choice) {
    case "rock":
      return "🪨";
    case "paper":
      return "📄";
    case "scissors":
      return "✂️";
    default:
      return "";
  }
}

// Get result message
function getResultMessage(playerChoice, computerChoice, result) {
  if (result === "draw") {
    return `${getIndonesianName(playerChoice)} sama dengan ${getIndonesianName(
      computerChoice
    )}!`;
  }

  if (result === "win") {
    if (playerChoice === "rock") {
      return "Batu menghancurkan Gunting!";
    } else if (playerChoice === "paper") {
      return "Kertas membungkus Batu!";
    } else {
      return "Gunting memotong Kertas!";
    }
  } else {
    if (computerChoice === "rock") {
      return "Batu menghancurkan Gunting!";
    } else if (computerChoice === "paper") {
      return "Kertas membungkus Batu!";
    } else {
      return "Gunting memotong Kertas!";
    }
  }
}

// Get Indonesian name for choice
function getIndonesianName(choice) {
  switch (choice) {
    case "rock":
      return "Batu";
    case "paper":
      return "Kertas";
    case "scissors":
      return "Gunting";
    default:
      return choice;
  }
}

// Animate result in 3D scene
function animateResult(result) {
  // Temukan objek game
  let playerObj, computerObj;

  if (gameState.playerChoice === "rock") playerObj = rockMesh;
  else if (gameState.playerChoice === "paper") playerObj = paperMesh;
  else if (gameState.playerChoice === "scissors") playerObj = scissorsMesh;

  if (gameState.computerChoice === "rock") computerObj = rockMesh;
  else if (gameState.computerChoice === "paper") computerObj = paperMesh;
  else if (gameState.computerChoice === "scissors") computerObj = scissorsMesh;

  // Sembunyikan semua objek dengan animasi yang lebih jelas
  gsap.to(rockMesh.position, {
    y: -5,
    duration: 1,
    ease: "power2.in",
  });
  gsap.to(paperMesh.position, {
    y: -5,
    duration: 1,
    ease: "power2.in",
  });
  gsap.to(scissorsMesh.position, {
    y: -5,
    duration: 1,
    ease: "power2.in",
  });

  // Tambahkan teks petunjuk animasi
  const animationText = document.createElement("div");
  animationText.className = "animation-text";
  animationText.style.position = "absolute";
  animationText.style.top = "50%";
  animationText.style.left = "50%";
  animationText.style.transform = "translate(-50%, -50%)";
  animationText.style.color = "white";
  animationText.style.fontSize = "24px";
  animationText.style.fontWeight = "bold";
  animationText.style.textAlign = "center";
  animationText.style.textShadow = "0 0 10px rgba(0,0,0,0.8)";
  animationText.style.zIndex = "100";
  animationText.style.pointerEvents = "none";
  animationText.textContent = "Mempersiapkan pertarungan...";

  gameScene.appendChild(animationText);

  // Tampilkan pilihan pemain dan komputer dengan animasi yang lebih jelas
  setTimeout(() => {
    // Hapus teks petunjuk
    animationText.textContent = "Pertarungan dimulai!";

    if (playerObj && computerObj) {
      // Posisikan objek dengan animasi yang lebih jelas
      gsap.to(playerObj.position, {
        x: -1.5,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)",
      });

      gsap.to(computerObj.position, {
        x: 1.5,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)",
      });

      // Tambahkan efek skala untuk menekankan objek
      gsap.to(playerObj.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.5,
      });

      gsap.to(computerObj.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.5,
      });

      // Tambahkan teks label untuk objek
      setTimeout(() => {
        animationText.textContent = "VS";

        // Animasikan berdasarkan hasil dengan animasi yang lebih jelas
        setTimeout(() => {
          if (result === "win") {
            animationText.textContent = "Kamu Menang!";
            animationText.style.color = "var(--success-color)";

            gsap.to(playerObj.position, {
              y: 1.5,
              duration: 1,
              ease: "power2.out",
            });

            gsap.to(computerObj.position, {
              y: -1,
              duration: 1,
              ease: "power2.in",
            });

            // Tambahkan efek rotasi kemenangan yang lebih jelas
            gsap.to(playerObj.rotation, {
              y: playerObj.rotation.y + Math.PI * 2,
              duration: 2,
              ease: "power2.inOut",
            });

            // Tambahkan efek partikel untuk kemenangan
            createVictoryParticles(playerObj.position);
          } else if (result === "lose") {
            animationText.textContent = "Kamu Kalah!";
            animationText.style.color = "var(--danger-color)";

            gsap.to(playerObj.position, {
              y: -1,
              duration: 1,
              ease: "power2.in",
            });

            gsap.to(computerObj.position, {
              y: 1.5,
              duration: 1,
              ease: "power2.out",
            });

            // Tambahkan efek rotasi kemenangan untuk komputer
            gsap.to(computerObj.rotation, {
              y: computerObj.rotation.y + Math.PI * 2,
              duration: 2,
              ease: "power2.inOut",
            });

            // Tambahkan efek partikel untuk kekalahan
            createVictoryParticles(computerObj.position);
          } else {
            animationText.textContent = "Seri!";
            animationText.style.color = "var(--neutral-color)";

            // Buat keduanya bergerak naik-turun
            gsap.to([playerObj.position, computerObj.position], {
              y: 0.5,
              duration: 0.5,
              yoyo: true,
              repeat: 3,
              ease: "power2.inOut",
            });
          }

          // Hapus teks animasi setelah beberapa detik
          setTimeout(() => {
            gameScene.removeChild(animationText);
          }, 2000);
        }, 1000);
      }, 1000);
    }
  }, 1000);
}

// Buat partikel untuk efek kemenangan
function createVictoryParticles(position) {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 100;

  const posArray = new Float32Array(particlesCount * 3);
  const colorArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i += 3) {
    // Posisi awal partikel
    posArray[i] = position.x + (Math.random() - 0.5) * 0.5;
    posArray[i + 1] = position.y + (Math.random() - 0.5) * 0.5;
    posArray[i + 2] = position.z + (Math.random() - 0.5) * 0.5;

    // Warna partikel (kuning/emas)
    colorArray[i] = 1;
    colorArray[i + 1] = 0.8 + Math.random() * 0.2;
    colorArray[i + 2] = 0;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );
  particlesGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colorArray, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 1,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Animasikan partikel
  const positions = particlesMesh.geometry.attributes.position.array;

  for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3;

    gsap.to(positions, {
      [i3]: positions[i3] + (Math.random() - 0.5) * 3,
      [i3 + 1]: positions[i3 + 1] + Math.random() * 3,
      [i3 + 2]: positions[i3 + 2] + (Math.random() - 0.5) * 3,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => {
        particlesMesh.geometry.attributes.position.needsUpdate = true;
      },
    });
  }

  // Fade out partikel
  gsap.to(particlesMaterial, {
    opacity: 0,
    duration: 2,
    onComplete: () => {
      scene.remove(particlesMesh);
    },
  });
}

// Show game over
function showGameOver() {
  // Update game over modal
  if (gameState.playerScore > gameState.computerScore) {
    finalResultEl.textContent = "Kemenangan!";
    finalResultEl.style.color = "var(--success-color)";
    finalMessageEl.textContent = "Kamu telah menguasai semua elemen!";
  } else {
    finalResultEl.textContent = "Kekalahan!";
    finalResultEl.style.color = "var(--danger-color)";
    finalMessageEl.textContent = "Elemen telah mengalahkanmu kali ini...";
  }

  finalPlayerScoreEl.textContent = gameState.playerScore;
  finalComputerScoreEl.textContent = gameState.computerScore;

  // Show modal
  setTimeout(() => {
    resultModal.classList.add("hidden");
    gameOverModal.classList.remove("hidden");
  }, 1500);
}

// Reset game
function resetGame() {
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  gameState.round = 1;
  gameState.isGameOver = false;
  gameState.gameHistory = [];

  updateUI();

  // Reset 3D scene
  resetScene();
}

// Update UI
function updateUI() {
  playerScoreEl.textContent = gameState.playerScore;
  computerScoreEl.textContent = gameState.computerScore;
  roundNumberEl.textContent = gameState.round;
  gameStatusEl.textContent = "Pilih senjatamu!";
}

// Reset 3D scene
function resetScene() {
  // Reset posisi objek
  gsap.to(rockMesh.position, {
    x: -2,
    y: 0,
    z: 0,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });

  gsap.to(paperMesh.position, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });

  gsap.to(scissorsMesh.position, {
    x: 2,
    y: 0,
    z: 0,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });

  // Reset skala
  gsap.to([rockMesh.scale, paperMesh.scale, scissorsMesh.scale], {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.5,
  });

  // Restart animasi
  animateGameObjects([rockMesh, paperMesh, scissorsMesh]);
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
    toggleFullscreenBtn.textContent = "⛶";

    // Perbaiki ukuran renderer setelah fullscreen
    setTimeout(() => {
      onWindowResize();
    }, 100);
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      toggleFullscreenBtn.textContent = "⛶";

      // Perbaiki ukuran renderer setelah keluar dari fullscreen
      setTimeout(() => {
        onWindowResize();
      }, 100);
    }
  }
}

// Perbaiki fungsi playSound untuk menggunakan audio yang sebenarnya
function playSound(sound) {
  try {
    if (gameState.soundEnabled && audioFiles[sound]) {
      // Clone audio untuk memungkinkan pemutaran bersamaan
      const audio = audioFiles[sound].cloneNode();
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.log("Audio playback error:", err);
      });
    }
  } catch (error) {
    console.log("Error playing sound:", error);
  }
}

// Helper functions
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize the game
init();
