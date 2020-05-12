/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, Vector2, AudioListener, Audio, AudioLoader } from '../node_modules/three/src/Three.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from './components/scenes';
import { C_HEIGHT, V_RADIUS, S_RADIUS } from './components/objects';
import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from '../node_modules/three/examples/jsm/postprocessing/GlitchPass.js';
import { UnrealBloomPass } from '../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Color } from '../node_modules/three/build/three.module.js';
import './styles.css';

// Initialize core ThreeJS components
const scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

var renderScene = new RenderPass(scene, camera);
var composer = new EffectComposer( renderer );

var bloomStrength = 0.5;
var bloomRadius = 0.5;
var bloomThreshold = 0.4;
var bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold);

composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Set up camera
camera.position.set(0, 0, 8);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// var btn = document.createElement("BUTTON");   // Create a <button> element
// btn.innerHTML = "CLICK ME";                   // Insert text
// document.body.appendChild(btn); 

// Set up controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.enablePan = false;
// controls.minDistance = 4;
// controls.maxDistance = 16;
// controls.update();

var listener = new AudioListener();
camera.add( listener );
var sound = new Audio( listener );
var audioLoader = new AudioLoader();
var audioLoader2 = new AudioLoader();

let roundDistance = 0;
let maxDistance = 0;

let tubeRemove = -1;
let curTubeDist = 0;
let prevAngle = 0;

let showMenu = false;
let endedGame = false;
const startmenu = document.getElementById("startmenu");
const currentScore = document.getElementById("currentscore");
const scoreMenu = document.getElementById("scoremenu");
const endmenu = document.getElementById("endmenu");
const endScore = document.getElementById("endscore");

let soundOn = false;

const startGame = event => {
    if (!showMenu) {
        startmenu.classList.add("started");
        scoremenu.classList.remove("started");
        showMenu = true;

    } else {
        startmenu.classList.remove("started");
        scoremenu.classList.add("started");
        showMenu = false;
    }
};

function endGame() {
    endmenu.classList.add("ended");
    endScore.textContent = `${scene.virusCount}`;
    endedGame = true;
    scoremenu.classList.remove("started");
    if (soundOn) {
        audioLoader.load( './src/components/sounds/Osmosis_Jones_Intro.mp3', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop(true);
            sound.autoplay = true;
            sound.setVolume(0.5);
            sound.play();
        });
    }
}

startGame();
// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    // controls.update();
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);

    if (curTubeDist >=1 && tubeRemove !== -1) {
        scene.tube.remove(tubeRemove);
        scene.tube.removeObjs();
        tubeRemove = -1;
    }

    // while (scene.viruses[0] && scene.viruses[0].position.z > camera.position.z + C_HEIGHT/2) {
    // 	scene.addViruses(0);
    // }
    // while (scene.redcells[0] && scene.redcells[0].position.z > camera.position.z + C_HEIGHT/2) {
    // 	scene.addRedCells(0);
    // }

    const curSpeed = 0.1;
    const curve = scene.tube.curves[0];
    const length = curve.getLength();

    const curPoint = curve.getPoint(curTubeDist/length);
    const nextPoint = curve.getPoint(Math.min((curTubeDist + curSpeed)/length, 1));
    var vecMove = new Vector3();
    vecMove.subVectors(curPoint, nextPoint);
    vecMove.applyAxisAngle(new Vector3(0,1,0), scene.tube.rotations[0]);
    var tangent = curve.getTangent(Math.min((curTubeDist + curSpeed/2)/length, 1));
    var angle = tangent.angleTo(new Vector3(0,0,-1));
    curTubeDist += curSpeed;
    if (scene.tube.left[0]) {
        scene.tube.rotateY(prevAngle - angle);
    } else {
        scene.tube.rotateY(angle - prevAngle);
    }
    prevAngle = angle;
    roundDistance += curSpeed;

    [...scene.tube.meshes].forEach(obj => {
        obj.position.x += vecMove.x;
        obj.position.y += vecMove.y;
        obj.position.z += vecMove.z;
    });
    [...scene.tube.clots].forEach(obj => {
        obj.position.x += vecMove.x;
        obj.position.y += vecMove.y;
        obj.position.z += vecMove.z;
    });
    const virusSpeed = 0.01;
    [...scene.tube.viruses].forEach(obj => {
        obj.position.x += vecMove.x;
        obj.position.y += vecMove.y;
        obj.position.z += vecMove.z;
        // obj.position.z += curSpeed;
        // obj.position.x += curSpeed * (Math.random() * 2.0 - 1.0) * virusSpeed;
        // obj.position.y += curSpeed * (Math.random() * 2.0 - 1.0) * virusSpeed;
    });

    const redCellSpeed = 0.2;
    [...scene.tube.redcells].forEach(obj => {
        obj.position.x += vecMove.x;
        obj.position.y += vecMove.y;
        obj.position.z += vecMove.z;
        // obj.position.z += curSpeed * redCellSpeed;
        // obj.position.x += curSpeed * (Math.random() * 2.0 - 1.0) * redCellSpeed;
        // obj.position.y += curSpeed * (Math.random() * 2.0 - 1.0) * redCellSpeed;
    });

    currentScore.textContent = `${scene.virusCount}`;

    scene.simulate(); // simulate sphere position

    if (curTubeDist >= length) { // if we have moved farther than current tube, remove tube and move to next
        curTubeDist = 0;
        prevAngle = 0;
        tubeRemove = scene.tube.meshes[0];
        scene.tube.addTube();
    }

    // virus collision detection
    for (let i = 0; i < scene.tube.nviruses[0] + scene.tube.nviruses[1]; i++) {
        let virus = scene.tube.viruses[i];
        var vpos = virus.position.clone();
        vpos.z += 7;
        if (vpos.distanceTo(scene.sphere.position) < S_RADIUS + V_RADIUS - 0.08 && Math.abs(scene.sphere.position.z - vpos.z) < 0.08) {
    		scene.tube.removeVirus(i);
    		scene.addVirusCount();
            if (!showMenu && !endedGame && soundOn) {
                audioLoader2.load( './src/components/sounds/squish.mp3', function( buffer ) {
                    sound.setBuffer( buffer );
                    sound.setLoop(false);
                    sound.setVolume(0.4);
                    sound.play();
                });
            }
    	}
    }
    // clot collision detection
    for (let i = 0; i < scene.tube.nclots[0] + scene.tube.nclots[1]; i++) {
        let clot = scene.tube.clots[i];
        var cpos = clot.position.clone();
        cpos.z += 7;
    	if (cpos.distanceTo(scene.sphere.position) < S_RADIUS + clot.radius - 0.1) {
            if (!showMenu) {
                endGame();
            }
            if (!showMenu && !endedGame && soundOn) {
                audioLoader2.load( './src/components/sounds/crash.mp3', function( buffer ) {
                    sound.setBuffer( buffer );
                    sound.setLoop(false);
                    sound.setVolume(0.4);
                    sound.play();
                });
            }
    	}
    }
    // redcell collision detection
    for (let i = 0; i < scene.tube.nredcells[0] + scene.tube.nredcells[1]; i++) {
        let redcell = scene.tube.redcells[i];
        var rpos = redcell.position.clone();
        rpos.z += 7;
        if (rpos.distanceTo(scene.sphere.position) < redcell.radius + V_RADIUS + 0.08) {
            rpos.sub(scene.sphere.position);
            redcell.position.x += rpos.x;
            redcell.position.y += rpos.y;
            redcell.position.z += rpos.z;
    	}
    }

    let spherePos = scene.sphere.position.clone().setZ(0);
    const cameraPos = camera.position.clone().setZ(0);
    const disp = new Vector3().subVectors(spherePos, cameraPos);
    const dist = disp.length() ** 2;
    disp.setLength = (dist);
    camera.position.add(disp);

    camera.position.lerp(new Vector3(0, 0, camera.position.z), 0.1);
    camera.position.z = 1.2 + scene.sphere.position.z;

    composer.render();
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

window.addEventListener("keydown", handleImpactEvents, false);

function handleImpactEvents(event) {
    // Ignore keypresses typed into a text box
    if (event.target.tagName === "INPUT") { return; }

    // The vectors to which each key code in this handler maps
    const keyMap = {
        ArrowUp: new Vector3(0,  0.02,  0),
        ArrowDown: new Vector3(0,  -0.02,  0),
        ArrowLeft: new Vector3(-0.02,  0,  0),
        ArrowRight: new Vector3(0.02,  0,  0),
    };

    // turn sound on/off
    if (event.key == "m") {
        soundOn = !soundOn;
        if (showMenu && soundOn) {
            audioLoader.load( './src/components/sounds/Osmosis_Jones_Intro.mp3', function( buffer ) {
                sound.setBuffer( buffer );
                sound.setLoop(true);
                sound.autoplay = true;
                sound.setVolume(0.5);
                sound.play();
            });
        }
        if (!soundOn) {
            if (sound.isPlaying) {
                sound.stop();
            }
        }
    }

    // end game
    if (event.key == "q" && !showMenu) {
        endGame();
        return;
    }

    // return to start menu after game ends
    if (endedGame && event.key == "s") {
        showMenu = false;
        endedGame = false;
        scene.virusCount = 0;
        endmenu.classList.remove("ended");
        startGame();
        return;
    }

    // restart game after it ends
    if (endedGame && event.key == " ") {
        endedGame = false;
        endmenu.classList.remove("ended");
        scene.virusCount = 0;
        scoremenu.classList.add("started");
        if (sound.isPlaying) {
            sound.stop();
        }
        return;
    }


    // space to remove start menu
    if (showMenu && event.key == " ") {
        startmenu.classList.remove("started");
        showMenu = false;
        scene.virusCount = 0;
        scoremenu.classList.add("started");
        if (sound.isPlaying) {
            sound.stop();
        }
        return;
    }

    // ignore other key presses if game hasn't started
    if (showMenu || endedGame) {
        return;
    }

    // const scale = 30; // the magnitude of the offset produced by this impact

    // check only for bound keys
    if (event.key != "ArrowUp" && event.key != "ArrowDown" && event.key != "ArrowLeft"
      && event.key != "ArrowRight" && event.key != "Enter") {
        return;
    }

    if (event.key == "Enter") {
        // SceneParams.GRAVITY = -1.0 * SceneParams.GRAVITY;
        return;
    }

    // move sphere position if arrow key pressed
    if (scene.sphere != null) {
        scene.sphere.addForce(keyMap[event.key]);
    }
}
