console.log("SCRIPT LOADED");
function getEl(id){return document.getElementById(id);}
async function getCoordinates(place){

try{

let res = await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${place}`
);

let data = await res.json();

if(data.length === 0){
return null;
}

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

// ROLE
function selectRole(role){
currentRole=role;

if(role==="ngo") window.location="ngo.html";
if(role==="delivery") window.location="delivery.html";

getEl("roleSelection").style.display="none";
getEl("registrationForm").style.display="block";
getEl("formTitle").innerText="User Registration";
}

// VALIDATION
function submitDetails(){

let phone=getEl("phone").value;
let age=parseInt(getEl("age").value);

if(!/^[0-9]{10}$/.test(phone)) return alert("Invalid phone");
if(age<18||age>100) return alert("Invalid age");

getEl("registrationForm").style.display="none";
getEl("mainApp").style.display="block";
getEl("welcomeText").innerText="Welcome User";
}

// CAMERA (FIXED)
async function startCamera(){

try{

videoStream = await navigator.mediaDevices.getUserMedia({video:true});

let video = getEl("video");
video.srcObject = videoStream;
video.style.display="block";

// AUTO CAPTURE AFTER 2 SEC
setTimeout(()=>{
captureImage();
},2000);

}catch(e){
alert("Camera access failed");
}

}

// STOP CAMERA
function stopCamera(){
if(videoStream){
videoStream.getTracks().forEach(t=>t.stop());
}
}

// AI SCAN (AUTO)
async function captureImage(){

let video=getEl("video");

if(!video.videoWidth){
getEl("status").innerText="Camera not ready";
return;
}

// DRAW FRAME
let canvas=document.createElement("canvas");
canvas.width=video.videoWidth;
canvas.height=video.videoHeight;

let ctx=canvas.getContext("2d");
ctx.drawImage(video,0,0);

let img=canvas.toDataURL();

// SHOW IMAGE
getEl("preview").src=img;
getEl("status").innerText="🔍 AI scanning food...";

try{

getEl("status").innerText="🧠 Processing result...";

// ===== LENIENT MODE (TEMP) =====

// simulate AI delay
try {

    getEl("status").innerText = "🧠 Sending to AI...";

    const response = await fetch("https://food-rescue-app-4jnl.onrender.com/scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: img })
    });

    const data = await response.json();

    getEl("status").innerText =
        "✅ " + data.name + " | Shelf life: " + data.shelfLife + " days";

    isFoodApproved = true;

} catch (e) {
    getEl("status").innerText = "❌ AI error";
    isFoodApproved = false;
}



}catch(e){
getEl("status").innerText="❌ AI error";
isFoodApproved=false;
}

}

// ADD FOOD (STRICT VALIDATION)
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

// SIMPLE LOCATION CHECK
if(location==="pune"){
getEl("deliveryResult").innerText="Specify exact location (e.g., Katepuram Chowk)";
return;
}

if(!location){
alert("Enter location");
return;
}

if(!name){
alert("Enter food name");
return;
}

// CARD
let d=document.createElement("div");

d.style.border="1px solid #2e7d32";
d.style.padding="10px";
d.style.margin="10px";
d.style.borderRadius="8px";

let unit = getEl("unit").value;

d.innerText="Food: "+name+" | Qty: "+qty+" "+unit+" | Location: "+location;

getEl("foodList").appendChild(d);

// SAVE
let foodData = {
name: name,
qty: qty,
unit: unit,
location: location
};

let foods = JSON.parse(localStorage.getItem("foods")) || [];
foods.push(foodData);
localStorage.setItem("foods", JSON.stringify(foods));
}

// NGO FLOW
function goToNGO(){

let foods = localStorage.getItem("foods");

if(!foods){
alert("Add food first");
return;
}

localStorage.setItem("ngoData", foods);
window.location="ngo.html";
}

// DELIVERY
function findDelivery(){

let foods = localStorage.getItem("foods");

if(!foods){
alert("Add food first");
return;
}

localStorage.setItem("delivery", foods);

getEl("deliveryResult").innerText="🚚 Delivery agent assigned";
}

// NGO → DELIVERY
function goDelivery(){
let food=localStorage.getItem("food");
localStorage.setItem("delivery",food);
window.location="delivery.html";
}

// COMPLETE

// NGO LOGIC
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

// STATS
getEl("donations").innerText = foods.length;
getEl("foodCount").innerText = totalQty;
getEl("served").innerText = totalQty * 2;
getEl("totalQty").innerText = totalQty;

}
}

function acceptFood(){

let food = localStorage.getItem("ngoData");

if(!food){
alert("No food available");
return;
}

localStorage.setItem("delivery",food);
alert("Food sent to delivery");
}
// DELIVERY LOGIC
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

// RESET
localStorage.removeItem("delivery");
getEl("deliveryData").innerText = "No active delivery";
}
// NGO CHART
if(document.getElementById("ngoChart")){

let ctx = document.getElementById("ngoChart").getContext("2d");

new Chart(ctx,{
type:"doughnut",
data:{
labels:["Individuals","Corporate","Events"],
datasets:[{
data:[55,30,15],
backgroundColor:["#2e7d32","#1e88e5","#ff7043"]
}]
}
});

}
// MAP
console.log("NGO DATA:", localStorage.getItem("ngoData"));
window.addEventListener("load", async ()=>{
console.log("MAP BLOCK RUNNING");
if(document.getElementById("map")){

let foods = JSON.parse(localStorage.getItem("ngoData")) || [];

if(foods.length === 0) return;

let lastFood = foods[foods.length - 1];

// GET COORDINATES
let pickup = await getCoordinates(lastFood.location);

if(!pickup){
alert("Invalid location");
return;
}

// DEFAULT DELIVERY LOCATION (can improve later)
let drop = {lat: pickup.lat + 0.01, lng: pickup.lng + 0.01};

// MAP
let map = L.map('map').setView([pickup.lat, pickup.lng], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

// MARKERS
L.marker([pickup.lat, pickup.lng]).addTo(map)
.bindPopup("Pickup: " + lastFood.location);

L.marker([drop.lat, drop.lng]).addTo(map)
.bindPopup("Delivery");

// ROUTE LINE
let route = [
[pickup.lat, pickup.lng],
[drop.lat, drop.lng]
];

L.polyline(route, {color:'blue'}).addTo(map);

// MOVING MARKER
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
