console.log("SCRIPT LOADED");

function getEl(id){return document.getElementById(id);}

// ================= TIME =================
function updateTime(){
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  if(getEl("timeDisplay")){
    getEl("timeDisplay").innerText = timeString;
  }
}
setInterval(updateTime,1000);
updateTime();

// ================= LOCATION =================
async function getCoordinates(place){
try{
let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`);
let data = await res.json();

if(data.length === 0) return null;

return {
lat: parseFloat(data[0].lat),
lng: parseFloat(data[0].lon)
};
}catch(e){
return null;
}
}

let currentRole=null;
let videoStream=null;
let isFoodApproved=false;

// ================= ROLE =================
function selectRole(role){
currentRole=role;

if(role==="ngo") window.location="ngo.html";
if(role==="delivery") window.location="delivery.html";

getEl("roleSelection").style.display="none";
getEl("registrationForm").style.display="block";
getEl("formTitle").innerText="User Registration";
}

// ================= VALIDATION =================
function submitDetails(){
let phone=getEl("phone").value;
let age=parseInt(getEl("age").value);

if(!/^[0-9]{10}$/.test(phone)) return alert("Invalid phone");
if(age<18||age>100) return alert("Invalid age");

getEl("registrationForm").style.display="none";
getEl("mainApp").style.display="block";
getEl("welcomeText").innerText="Welcome User";
}

// ================= CAMERA =================
async function startCamera(){
try{
videoStream = await navigator.mediaDevices.getUserMedia({video:true});

let video = getEl("video");
video.srcObject = videoStream;
video.style.display="block";


}catch(e){
alert("Camera access failed");
}
}

function stopCamera(){
if(videoStream){
videoStream.getTracks().forEach(t=>t.stop());
}
}

// ================= AI SCAN =================
async function captureImage(){

let video=getEl("video");

if(!video.videoWidth){
getEl("status").innerText="Camera not ready";
return;
}

let canvas=document.createElement("canvas");
canvas.width=video.videoWidth;
canvas.height=video.videoHeight;

let ctx=canvas.getContext("2d");
ctx.drawImage(video,0,0);

let img=canvas.toDataURL();

getEl("preview").src=img;
getEl("status").innerText="🔍 Scanning...";

try{

const response = await fetch("https://food-rescue-app-4jnl.onrender.com/scan", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
  image: img,
  foodName: getEl("foodName").value
})
});

const data = await response.json();

if(!data.valid){
getEl("status").innerText="❌ No food detected";
isFoodApproved=false;
return;
}

if(!data.matches){
getEl("status").innerText =
"⚠️ Mismatch!\nDetected: " + data.detectedName;
isFoodApproved=false;
return;
}

getEl("status").innerText =
"✅ " + data.detectedName;

isFoodApproved=true;

getEl("status").innerText =
"✅ " + data.name + " | Shelf life: " + data.shelfLife + " days";

isFoodApproved=true;

}catch(e){
getEl("status").innerText="❌ AI error";
isFoodApproved=false;
}
}

// ================= ADD FOOD =================
function addFood(){

let qty=parseInt(getEl("quantity").value);

if(!qty || qty<=0){
alert("Enter valid quantity (>0)");
return;
}

if(!isFoodApproved){
alert("Scan valid food first");
return;
}

let name=getEl("foodName").value;
let location = getEl("location").value.toLowerCase();

if(location==="pune"){
getEl("deliveryResult").innerText="Specify exact location";
return;
}

if(!location) return alert("Enter location");
if(!name) return alert("Enter food name");

let unit = getEl("unit").value;

let d=document.createElement("div");
d.style.border="1px solid #2e7d32";
d.style.padding="10px";
d.style.margin="10px";
d.style.borderRadius="8px";

d.innerText=`Food: ${name} | Qty: ${qty} ${unit} | Location: ${location}`;

getEl("foodList").appendChild(d);

let foodData = {name,qty,unit,location};

let foods = JSON.parse(localStorage.getItem("foods")) || [];
foods.push(foodData);
localStorage.setItem("foods", JSON.stringify(foods));
}

// ================= NGO FLOW =================
function goToNGO(){
let foods = localStorage.getItem("foods");
if(!foods) return alert("Add food first");

localStorage.setItem("ngoData", foods);
window.location="ngo.html";
}

// ================= DELIVERY =================
function findDelivery(){
let foods = localStorage.getItem("foods");
if(!foods) return alert("Add food first");

localStorage.setItem("delivery", foods);
getEl("deliveryResult").innerText="🚚 Delivery agent assigned";
}

function goDelivery(){
let food=localStorage.getItem("food");
localStorage.setItem("delivery",food);
window.location="delivery.html";
}

// ================= NGO LOGIC =================
if(getEl("ngoList")){
let raw = localStorage.getItem("ngoData");

if(raw){
let foods = JSON.parse(raw);

let totalQty = 0;
let display = "";

foods.forEach(f=>{
display += `Food: ${f.name} | ${f.qty} ${f.unit} | ${f.location}\n`;
totalQty += parseInt(f.qty);
});

getEl("ngoList").innerText = display;

getEl("donations").innerText = foods.length;
getEl("foodCount").innerText = totalQty;
getEl("served").innerText = totalQty * 2;
getEl("totalQty").innerText = totalQty;
}
}

function acceptFood(){
let food = localStorage.getItem("ngoData");
if(!food) return alert("No food available");

localStorage.setItem("delivery",food);
alert("Food sent to delivery");
}

// ================= DELIVERY PAGE =================
if(getEl("deliveryData")){
let data = localStorage.getItem("delivery");

if(data){
getEl("deliveryData").innerText = data;
getEl("today").innerText = 1;
getEl("earn").innerText = 120;
}
}

function startDelivery(){
alert("Delivery started");
}

function completeDelivery(){
alert("Delivery completed");
localStorage.removeItem("delivery");
getEl("deliveryData").innerText = "No active delivery";
}

// ================= MAP =================
window.addEventListener("load", async ()=>{
if(document.getElementById("map")){

let foods = JSON.parse(localStorage.getItem("ngoData")) || [];
if(foods.length === 0) return;

let lastFood = foods[foods.length - 1];

let pickup = await getCoordinates(lastFood.location);
if(!pickup) return alert("Invalid location");

let drop = {lat: pickup.lat + 0.01, lng: pickup.lng + 0.01};

let map = L.map('map').setView([pickup.lat, pickup.lng], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

L.marker([pickup.lat, pickup.lng]).addTo(map)
.bindPopup("Pickup: " + lastFood.location);

L.marker([drop.lat, drop.lng]).addTo(map)
.bindPopup("Delivery");

let route = [
[pickup.lat, pickup.lng],
[drop.lat, drop.lng]
];

L.polyline(route, {color:'blue'}).addTo(map);

let movingMarker = L.marker([pickup.lat, pickup.lng]).addTo(map);

let step = 0;

setInterval(()=>{
let lat = pickup.lat + (drop.lat - pickup.lat)*(step/20);
let lng = pickup.lng + (drop.lng - pickup.lng)*(step/20);

movingMarker.setLatLng([lat,lng]);

step++;
if(step>20) step=0;

},1000);

}
});
async function openNGOPopup(){

if(!isFoodApproved){
alert("Scan valid food first");
return;
}

let location = getEl("location").value;

if(!location){
alert("Enter location first");
return;
}

getEl("deliveryResult").innerText = "🔍 Searching NGOs...";

// GET COORDINATES
let coords = await getCoordinates(location);

if(!coords){
alert("Invalid location");
return;
}

// FETCH REAL NGOs
let res = await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=ngo near ${location}`
);

let data = await res.json();

if(data.length === 0){
getEl("deliveryResult").innerText = "No NGOs found nearby";
return;
}

// SHOW RESULTS
let list = data.slice(0,5).map((ngo,i)=>{
return `${i+1}. ${ngo.display_name}`;
}).join("\n\n");

getEl("deliveryResult").innerText =
"Nearby NGOs:\n\n" + list + "\n\nAuto-selecting nearest...";

// AUTO SELECT NEAREST
let selectedNGO = data[0].display_name;

assignDelivery(selectedNGO);
}
function assignDelivery(ngo){

let foods = JSON.parse(localStorage.getItem("foods"));

if(!foods){
alert("No food data");
return;
}

// attach NGO
foods[foods.length - 1].ngo = ngo;

localStorage.setItem("ngoData", JSON.stringify(foods));

// delivery assignment
let agent = "Agent-" + Math.floor(Math.random()*100);

localStorage.setItem("delivery", JSON.stringify({
ngo: ngo,
agent: agent
}));

getEl("deliveryResult").innerText =
"✅ Assigned to:\n" + ngo +
"\n\n🚚 Delivery: " + agent;
}


async function sendMessage(){

let input = getEl("chatInput");
let msg = input.value;

if(!msg) return;

let chat = getEl("chatMessages");

let p1 = document.createElement("p");
p1.innerHTML = "<b>You:</b> " + msg;
chat.appendChild(p1);

input.value = "";
let res = await fetch("/chat",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({message:msg})
});

let data = await res.json();

let p2 = document.createElement("p");
p2.innerHTML = "<b>AI:</b> " + data.reply;
chat.appendChild(p2);

chat.scrollTop = chat.scrollHeight;
}
function init3D(){

const container = document.getElementById("threeContainer");

// scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / 180, 0.1, 1000);
camera.position.z = 5;

// renderer
const renderer = new THREE.WebGLRenderer({ alpha:true });
renderer.setSize(container.clientWidth, 180);
container.appendChild(renderer.domElement);

// light
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10,10,10);
scene.add(light);

// FONT LOADER
const loader = new THREE.FontLoader();

loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", function(font){

// TEXT
const geometry = new THREE.TextGeometry("ECOEATS AI", {
font: font,
size: 0.75,
height: 0.18,
curveSegments: 12,
bevelEnabled: true,
bevelThickness: 0.02,
bevelSize: 0.01,
bevelSegments: 5
});

const material = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
const textMesh = new THREE.Mesh(geometry, material);

// center text
geometry.computeBoundingBox();
const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
textMesh.position.x = xMid - 0.3;

scene.add(textMesh);

// APPLE (SPHERE)
const appleGeo = new THREE.SphereGeometry(0.3, 32, 32);
const appleMat = new THREE.MeshStandardMaterial({
color: 0xff3333,
emissive: 0x2196f3,
emissiveIntensity: 0.6
});
const apple = new THREE.Mesh(appleGeo, appleMat);
// TRAIL
const trailGeo = new THREE.SphereGeometry(0.05, 16, 16);
const trailMat = new THREE.MeshBasicMaterial({
color: 0x2196f3,
transparent: true,
opacity: 0.5
});

let trails = [];

scene.add(apple);
// EYES
const eyeGeo = new THREE.SphereGeometry(0.03, 16, 16);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
const eye2 = new THREE.Mesh(eyeGeo, eyeMat);

eye1.position.set(-0.08, 0.05, 0.28);
eye2.position.set(0.08, 0.05, 0.28);

apple.add(eye1);
apple.add(eye2);

// MOUTH
const mouthGeo = new THREE.TorusGeometry(0.08, 0.015, 16, 100, Math.PI);
const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

const mouth = new THREE.Mesh(mouthGeo, mouthMat);
mouth.position.set(0, -0.05, 0.28);
mouth.rotation.x = Math.PI;

apple.add(mouth);
// LEAF
const leafGeo = new THREE.ConeGeometry(0.07, 0.2, 8);
const leafMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
const leaf = new THREE.Mesh(leafGeo, leafMat);
leaf.position.y = 0.25;
apple.add(leaf);

// ANIMATION (ELLIPTICAL)
let t = 0;

function animate(){
requestAnimationFrame(animate);

// elliptical motion
t += 0.02;
// BLINK
const blink = Math.abs(Math.sin(t * 2));
eye1.scale.y = blink < 0.1 ? 0.1 : 1;
eye2.scale.y = blink < 0.1 ? 0.1 : 1;

// ellipse around FIRST LETTER "E"
const a = 0.6;   // tighter → first E
const b = 0.4;

// shift LEFT so it orbits FIRST "E"
const offsetX = -1.8;

apple.position.x = offsetX + a * Math.cos(t);
apple.position.y = b * Math.sin(t);
apple.position.y += 0.02 * Math.sin(t * 3);
// CREATE TRAIL PARTICLES
const trail = new THREE.Mesh(trailGeo, trailMat.clone());
trail.position.copy(apple.position);
scene.add(trail);
trails.push(trail);

// LIMIT TRAIL LENGTH
if(trails.length > 20){
scene.remove(trails[0]);
trails.shift();
}
// slight rotation
apple.rotation.y += 0.05;

renderer.render(scene, camera);
}

animate();

});

}

// INIT WHEN CHAT OPENS
function toggleChat(){
let box = document.getElementById("chatBox");

if(box.style.display === "none"){
box.style.display = "block";
if(!window.sceneLoaded){
setTimeout(init3D, 200);
window.sceneLoaded = true;
}
}else{
box.style.display = "none";
}
}