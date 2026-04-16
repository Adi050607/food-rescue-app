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

const response = async function scanFood(image) {
  try {
    const response = await fetch("/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image })
    });

    const data = await response.json();
    console.log(data);

    document.getElementById("result").innerText =
      "Food: " + data.name + " | Shelf Life: " + data.shelfLife + " days";

  } catch (error) {
    console.error(error);
  }
}

const data = await response.json();

if(data.valid === false){
getEl("status").innerText="❌ Not valid food";
isFoodApproved=false;
return;
}

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