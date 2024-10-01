// 初始化 Leaflet 地圖，中心點設為台灣 (可以根據需求調整經緯度)
const map = L.map('map').setView([25.03236, 121.51813], 10);

// 設定地圖圖層，這裡使用 OpenStreetMap 圖層
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 創建兩個 LayerGroup：一個是磅秤資訊，另一個是地磅資訊
const scaleLayer = L.layerGroup().addTo(map);
const storeLayer = L.layerGroup().addTo(map);

// 定義自定義的圖示
const greenIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-green.png',  // 地磅圖標
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const blueIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-blue.png',  // 磅秤圖標
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const redIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-red.png',  // 不合格圖標
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// 計算磅秤和地磅的數量
let scaleCount = 0;
let storeCount = 0;

// 自定義控制器來顯示磅秤和地磅數量
const infoControl = L.control({ position: 'bottomright' });

infoControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'leaflet-control-info');
    div.innerHTML = `<b>磅秤數量:</b> ${scaleCount}<br><b>地秤數量:</b> ${storeCount}`;
    return div;
};

// 將控制器添加到地圖
infoControl.addTo(map);

// 更新數量顯示
function updateInfoControl() {
    const infoDiv = document.querySelector('.leaflet-control-info');
    if (infoDiv) {
        infoDiv.innerHTML = `<b>磅秤數量:</b> ${scaleCount}<br><b>地秤數量:</b> ${storeCount}`;
    }
}

// 初始化時更新控制欄框
updateInfoControl();

// 篩選用變數
let marker = null;
let rangeCircle = null;

// 點擊地圖設定篩選定點
map.on('click', function(e) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(map);
});

// 計算距離函數 (根據兩點經緯度計算距離)
function calculateDistance(latlng1, latlng2) {
    const R = 6371e3; // 地球半徑 (公尺)
    const φ1 = latlng1.lat * Math.PI / 180;
    const φ2 = latlng2.lat * Math.PI / 180;
    const Δφ = (latlng2.lat - latlng1.lat) * Math.PI / 180;
    const Δλ = (latlng2.lng - latlng1.lng) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 返回距離 (公尺)
}

// 篩選資料在指定範圍內
function filterDataWithinRange(centerLatLng, range) {
    scaleLayer.clearLayers();
    storeLayer.clearLayers();
    scaleCount = 0;
    storeCount = 0;

    // 遍歷磅秤資料篩選
    fetch('scale-data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const latlng = L.latLng(item.latitude, item.longitude);
                const distance = calculateDistance(centerLatLng, latlng);

                if (distance <= range) {
                    const checkResult = String(item.檢查合格與否).trim().toUpperCase();
                    const markerIcon = checkResult === "N" ? redIcon : blueIcon;

                    const scaleMarker = L.marker(latlng, { icon: markerIcon }).addTo(scaleLayer);
                    scaleMarker.bindPopup(`<h2>市場磅秤</h2><b>${item.店名}</b><br>...`);
                    scaleCount++;
                }
            });
            updateInfoControl();
        });

    // 遍歷地磅資料篩選
    fetch('weighbridge-data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const latlng = L.latLng(item.latitude, item.longitude);
                const distance = calculateDistance(centerLatLng, latlng);

                if (distance <= range) {
                    const checkResult = String(item.檢查合格與否).trim().toUpperCase();
                    const markerIcon = checkResult === "N" ? redIcon : greenIcon;

                    const storeMarker = L.marker(latlng, { icon: markerIcon }).addTo(storeLayer);
                    storeMarker.bindPopup(`<h2>固定地秤</h2><b>${item.所有人}</b><br>...`);
                    storeCount++;
                }
            });
            updateInfoControl();
        });
}

// 點擊 "應用篩選" 按鈕時
document.getElementById('apply-filter').addEventListener('click', function() {
    if (marker) {
        const rangeInput = document.getElementById('range').value;
        if (rangeInput) {
            const range = parseFloat(rangeInput) * 1000; // 將公里轉為米
            if (rangeCircle) map.removeLayer(rangeCircle);
            rangeCircle = L.circle(marker.getLatLng(), { radius: range }).addTo(map);
            filterDataWithinRange(marker.getLatLng(), range);
        }
    }
});

// 添加圖層控制
const baseLayers = {};
const overlays = {
    "磅秤資訊": scaleLayer,
    "地磅資訊": storeLayer
};

L.control.layers(baseLayers, overlays).addTo(map);
