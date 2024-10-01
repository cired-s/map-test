// 初始化 Leaflet 地圖
const map = L.map('map').setView([25.03236, 121.51813], 10);

// 設定地圖圖層
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 創建 LayerGroup
const scaleLayer = L.layerGroup().addTo(map);
const storeLayer = L.layerGroup().addTo(map);

// 自定義圖示
const greenIcon = L.icon({ iconUrl: 'images/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const blueIcon = L.icon({ iconUrl: 'images/marker-icon-2x-blue.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const redIcon = L.icon({ iconUrl: 'images/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });

let scaleCount = 0;
let storeCount = 0;
let selectedPoint = null; // 選定的點

// 顯示磅秤和地秤數量
const infoControl = L.control({ position: 'bottomright' });

infoControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control-info');
    div.innerHTML = `<b>磅秤數量:</b> ${scaleCount}<br><b>地秤數量:</b> ${storeCount}`;
    return div;
};

infoControl.addTo(map);

function updateInfoControl() {
    const infoDiv = document.querySelector('.leaflet-control-info');
    if (infoDiv) {
        infoDiv.innerHTML = `<b>磅秤數量:</b> ${scaleCount}<br><b>地秤數量:</b> ${storeCount}`;
    }
}

updateInfoControl();

// 計算兩個經緯度之間的距離 (Haversine 公式)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑 (公里)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 距離 (公里)
}

// 顯示所有標記
function showAllMarkers() {
    // 清空圖層
    scaleLayer.clearLayers();
    storeLayer.clearLayers();
    scaleCount = 0;
    storeCount = 0;

    // 加載磅秤資料
    fetch('scale-data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const checkResult = String(item.檢查合格與否).trim().toUpperCase();
                const markerIcon = checkResult === "N" ? redIcon : blueIcon;

                const scaleMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(scaleLayer);
                scaleMarker.bindPopup(`<b>${item.店名}</b><br>廠牌: ${item.廠牌}`);
                scaleCount++;
            });
            updateInfoControl();
        });

    // 加載地磅資料
    fetch('weighbridge-data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const checkResult = String(item.檢查合格與否).trim().toUpperCase();
                const markerIcon = checkResult === "N" ? redIcon : greenIcon;

                const storeMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(storeLayer);
                storeMarker.bindPopup(`<b>${item.所有人}</b><br>廠牌: ${item.廠牌}`);
                storeCount++;
            });
            updateInfoControl();
        });
}

// 初始化顯示所有標記
showAllMarkers();

// 當點擊地圖時標定定點
map.on('click', function(e) {
    if (selectedPoint) {
        map.removeLayer(selectedPoint); // 移除之前的標定點
    }

    // 在點擊位置放置一個標定點
    selectedPoint = L.marker(e.latlng).addTo(map).bindPopup('篩選定點').openPopup();

    // 顯示範圍輸入框
    document.getElementById('distance').style.display = 'block';
});

// 篩選邏輯
document.getElementById('apply-filter').addEventListener('click', function() {
    const distance = document.getElementById('distance').value;
    const selectedBrand = document.getElementById('brand').value;

    if (!selectedPoint) {
        alert('請先在地圖上選擇一個篩選定點。');
        return;
    }

    const { lat, lng } = selectedPoint.getLatLng();

    // 清空圖層
    scaleLayer.clearLayers();
    storeLayer.clearLayers();
    scaleCount = 0;
    storeCount = 0;

    // 磅秤篩選
    fetch('scale-data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const checkResult = String(item.檢查合格與否).trim().toUpperCase();
                const markerIcon = checkResult === "N" ? redIcon : blueIcon;

                const markerDistance = getDistanceFromLatLonInKm(lat, lng, item.latitude, item.longitude);
                if ((selectedBrand === "" || item.廠牌 === selectedBrand) && markerDistance <= distance) {
                    const scaleMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(scaleLayer);
                    scaleMarker.bindPopup(`<b>${item.店名}</b><br>廠牌: ${item.廠牌}`);
                    scaleCount++;
                }
            });
            updateInfoControl();
        });

    // 地磅篩選
    fetch('weighbridge-data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const checkResult = String(item.檢查合格與否).trim().toUpperCase();
                const markerIcon = checkResult === "N" ? redIcon : greenIcon;

                const markerDistance = getDistanceFromLatLonInKm(lat, lng, item.latitude, item.longitude);
                if ((selectedBrand === "" || item.廠牌 === selectedBrand) && markerDistance <= distance) {
                    const storeMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(storeLayer);
                    storeMarker.bindPopup(`<b>${item.所有人}</b><br>廠牌: ${item.廠牌}`);
                    storeCount++;
                }
            });
            updateInfoControl();
        });
});

