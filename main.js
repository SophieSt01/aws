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
    stations: L.featureGroup().addTo(map), 
    temperature: L.featureGroup().addTo(map)
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
    "Temperatur": themaLayer.temperature,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Temperaturfunktion definieren
function showTemperature(geojson) {
    L.geoJSON(geojson, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span>${feature.properties.LT}</span>`
                })
            })
        }
    }).addTo(themaLayer.temperature); //gson aufruf, den braucht es am schluss, damit es auch angezeigt wird
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
}
showStations("https://static.avalanche.report/weather_stations/stations.geojson");

// noch bessere Alternative für Zeile 60 (hier passts auch mit 0°C):
// <li> Lufttemperatur (°C): ${feature.properties.LT != undefined ? feature.properties.LT.toFixed(1): "-"}</li> 