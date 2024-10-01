// 初始化 Leaflet 地圖，中心點設為台灣 (可以根據需求調整經緯度)
const map = L.map('map').setView([25.03236, 121.51813], 10);

// 設定地圖圖層，這裡使用 OpenStreetMap 圖層
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 創建兩個 LayerGroup：一個是磅秤資訊，另一個是地磅資訊
const scaleLayer = L.layerGroup().addTo(map);
const storeLayer = L.layerGroup().addTo(map);

// 自定義標定點和範圍圈
let marker = null;  // 標定點
let rangeCircle = null;  // 範圍圈

// 自定義控制器來顯示篩選結果
const infoControl = L.control({ position: 'bottomright' });

infoControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'leaflet-control-info');
    div.innerHTML = `<b>磅秤數量:</b> 0<br><b>地秤數量:</b> 0`;
    return div;
};

// 將控制器添加到地圖
infoControl.addTo(map);

// 更新篩選結果數量顯示
function updateInfoControl(scaleCount, storeCount) {
    const infoDiv = document.querySelector('.leaflet-control-info');
    if (infoDiv) {
        infoDiv.innerHTML = `<b>磅秤數量:</b> ${scaleCount}<br><b>地秤數量:</b> ${storeCount}`;
    }
}

// 添加點擊地圖事件，用來標定位置並顯示範圍圈
map.on('click', function(e) {
    const latlng = e.latlng;

    // 移除舊的標定點和範圍圈
    if (marker) map.removeLayer(marker);
    if (rangeCircle) map.removeLayer(rangeCircle);

    // 添加新的標定點
    marker = L.marker(latlng).addTo(map);

    // 當用戶輸入範圍後，顯示範圍圈
    const rangeInput = document.getElementById('range').value;
    if (rangeInput) {
        const range = parseFloat(rangeInput) * 1000; // 轉換成米
        rangeCircle = L.circle(latlng, { radius: range }).addTo(map);
        filterDataWithinRange(latlng, range);
    }
});

// 從 scale-data.json 和 weighbridge-data.json 加載數據
let scaleData = [];
let weighbridgeData = [];

fetch('scale-data.json')
    .then(response => response.json())
    .then(data => {
        scaleData = data;
        displayAllMarkers();
    })
    .catch(error => {
        console.error('Error loading scale data:', error);
    });

fetch('weighbridge-data.json')
    .then(response => response.json())
    .then(data => {
        weighbridgeData = data;
        displayAllMarkers();
    })
    .catch(error => {
        console.error('Error loading weighbridge data:', error);
    });

// 顯示所有磅秤和地磅的標記
function displayAllMarkers() {
    scaleLayer.clearLayers();
    storeLayer.clearLayers();

    let scaleCount = 0;
    let storeCount = 0;

    scaleData.forEach(item => {
        const checkResult = String(item.檢查合格與否).trim().toUpperCase();
        const markerIcon = checkResult === "N" ? redIcon : blueIcon;

        const scaleMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(scaleLayer);
        scaleMarker.bindPopup(`
            <h2>市場磅秤</h2>
            <b>${item.店名}</b><br>
            廠牌: ${item.廠牌}<br>
            型式: ${item.型式}<br>
            器號: ${item.器號}<br>
            Max (kg): ${item.Max_kg}<br>
            e (g): ${item.e_g}<br>
            檢定日期: ${item.檢定日期}<br>
            檢定合格單號: ${item.檢定合格單號}<br>
            檢查日期: ${item.檢查日期}<br>
            檢查合格與否: ${item.檢查合格與否}
        `);
        scaleCount++;
    });

    weighbridgeData.forEach(item => {
        const checkResult = String(item.檢查合格與否).trim().toUpperCase();
        const markerIcon = checkResult === "N" ? redIcon : greenIcon;

        const storeMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(storeLayer);
        storeMarker.bindPopup(`
            <h2>固定地秤</h2>
            <b>${item.所有人}</b><br>
            地址: ${item.地址}<br>
            廠牌: ${item.廠牌}<br>
            型號: ${item.型號}<br>
            器號: ${item.器號}<br>
            Max (t): ${item.Max_t}<br>
            e (kg): ${item.e_kg}<br>
            檢定合格期限: ${item.檢定合格期限}<br>
            檢定合格單號: ${item.檢定合格單號}<br>
            檢查日期: ${item.檢查日期}<br>
            檢查合格與否: ${item.檢查合格與否}
        `);
        storeCount++;
    });

    updateInfoControl(scaleCount, storeCount);
}

// 篩選範圍內的數據並顯示
function filterDataWithinRange(latlng, range) {
    scaleLayer.clearLayers();
    storeLayer.clearLayers();

    let scaleCount = 0;
    let storeCount = 0;

    scaleData.forEach(item => {
        const distance = map.distance(latlng, L.latLng(item.latitude, item.longitude));
        if (distance <= range) {
            const checkResult = String(item.檢查合格與否).trim().toUpperCase();
            const markerIcon = checkResult === "N" ? redIcon : blueIcon;

            const scaleMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(scaleLayer);
            scaleMarker.bindPopup(`
                <h2>市場磅秤</h2>
                <b>${item.店名}</b><br>
                廠牌: ${item.廠牌}<br>
                型式: ${item.型式}<br>
                器號: ${item.器號}<br>
                Max (kg): ${item.Max_kg}<br>
                e (g): ${item.e_g}<br>
                檢定日期: ${item.檢定日期}<br>
                檢定合格單號: ${item.檢定合格單號}<br>
                檢查日期: ${item.檢查日期}<br>
                檢查合格與否: ${item.檢查合格與否}
            `);
            scaleCount++;
        }
    });

    weighbridgeData.forEach(item => {
        const distance = map.distance(latlng, L.latLng(item.latitude, item.longitude));
        if (distance <= range) {
            const checkResult = String(item.檢查合格與否).trim().toUpperCase();
            const markerIcon = checkResult === "N" ? redIcon : greenIcon;

            const storeMarker = L.marker([item.latitude, item.longitude], { icon: markerIcon }).addTo(storeLayer);
            storeMarker.bindPopup(`
                <h2>固定地秤</h2>
                <b>${item.所有人}</b><br>
                地址: ${item.地址}<br>
                廠牌: ${item.廠牌}<br>
                型號: ${item.型號}<br>
                器號: ${item.器號}<br>
                Max (t): ${item.Max_t}<br>
                e (kg): ${item.e_kg}<br>
                檢定合格期限: ${item.檢定合格期限}<br>
                檢定合格單號: ${item.檢定合格單號}<br>
                檢查日期: ${item.檢查日期}<br>
                檢查合格與否: ${item.檢查合格與否}
            `);
            storeCount++;
        }
    });

    updateInfoControl(scaleCount, storeCount);
}

// 點擊 "應用篩選" 按鈕時重新篩選資料
document.getElementById('apply-filter').addEventListener('click', function() {
    if (marker) {
        const rangeInput = document.getElementById('range').value;
        if (rangeInput) {
            const range = parseFloat(rangeInput) * 1000; // 將公里數轉換為米
            if (rangeCircle) map.removeLayer(rangeCircle);
            rangeCircle = L.circle(marker.getLatLng(), { radius: range }).addTo(map);
            filterDataWithinRange(marker.getLatLng(), range);
        }
    }
});

// 定義自定義的圖示
const greenIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const blueIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const redIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});


  
             
               
       



