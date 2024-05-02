/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 11);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup(), // wenn ich ergänze: .addTo(map), dann wirds direkt in der Karte angezeigt, so muss ichs anklicken
    temperature: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map)
}

// Hintergrundlayer
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur (°C)": themaLayer.temperature,
    "Windgeschwindigkeit": themaLayer.wind,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// funktion, die Farbe für Temperatur, Wind, Schneehöhe definiert
function getColor(value, ramp) {  // ramp steht für Farbpalette
    //console.log("getColor: value:", value, "ramp:", ramp);
    for (let rule of ramp) {
        //console.log("Rule: ", rule);
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}

// zum ausprobieren, obs geht:
/*let color = getColor(17, COLORS.temperature);
console.log("Color for 17 deg.:", color); */

// Temperaturfunktion definieren
function showTemperature(geojson) {
    L.geoJSON(geojson, {
        filter: function(feature){
            //feature.properties.LT; wenn man am Ende der Funktion sagt: "return True", dann wird er angezeigt, sonst nicht
            if(feature.properties.LT > -50 && feature.properties.LT < 50){
                return true;
            }
        },
        pointToLayer: function(feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature); //für jede Temp. steht jetzt Farbe da
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};"> ${feature.properties.LT.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.temperature); //gson aufruf, den braucht es am schluss, damit es auch angezeigt wird
}


function showWind(geojson) {
    L.geoJSON(geojson, {
        filter: function(feature){
            //feature.properties.LT; wenn man am Ende der Funktion sagt: "return True", dann wird er angezeigt, sonst nicht
            if(feature.properties.WG> 0 && feature.properties.WG < 250){
                return true;
            }
        },
        pointToLayer: function(feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind); //für jede Temp. steht jetzt Farbe da
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span title = "${feature.properties.WG.toFixed(1)} km/h"> 
                    <i style="transform:rotate(${feature.properties.WR}deg); color:${color}" class="fa-solid fa-circle-arrow-down"></i></span>`,
                })
            })
        }
    }).addTo(themaLayer.wind);
}

// GeoJSON der Wetterstationen laden (muss asynchron sein: async --> await)
async function showStations(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    // Wetterstationen mit Icons und Popups
    console.log(geojson)
    L.geoJSON(geojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'icons/wifi.png',
                    iconAnchor: [16, 0], // 16, weil Bild genau um die Hälfte nach links verschoben werden muss
                    popAnchor: [0, -37]
                })
            });
        },
        onEachFeature: function (feature, layer) {
            console.log(feature);
            console.log(feature.properties.name);
            let pointInTime = new Date (feature.properties.date)
            console.log(pointInTime)
            layer.bindPopup(`
          <h4>${feature.properties.name} (${feature.geometry.coordinates[2]} m)</h4>
          <ul>
          <li>Lufttemperatur (°C): ${feature.properties.LT || "-"}</li>
          <li>Relative Luftfeuchte (%): ${feature.properties.RH || "-"}</li>
          <li>Windgeschwindigkeit (km/h): ${feature.properties.WG || "-"} </li>
          <li>Schneehöhe (cm): ${feature.properties.HS || "-"} </li>
          </ul>
          <p>${feature.properties.date}</p>
          <span>${pointInTime.toLocaleString()}</span>

        `);
        }
    }).addTo(themaLayer.stations);
    showTemperature(geojson);
    showWind(geojson);
}
showStations("https://static.avalanche.report/weather_stations/stations.geojson");

// noch bessere Alternative für Zeile 60 (hier passts auch mit 0°C):
// <li> Lufttemperatur (°C): ${feature.properties.LT != undefined ? feature.properties.LT.toFixed(1): "-"}</li> 