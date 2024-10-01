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

// 計算磅秤和地磅的數量
let scaleCount = 0;
let storeCount = 0;

// 自定義控制器來顯示磅秤和地磅數量
const infoControl = L.control({ position: 'bottomright' });

infoControl.onAdd = function (map) {
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

// 用於範圍標記和圓形
let selectedMarker = null;
let rangeCircle = null;

// 當使用者點選地圖時，添加標記並顯示範圍
map.on('click', function (e) {
    if (selectedMarker) {
        map.removeLayer(selectedMarker);  // 移除之前的標記
    }
    if (rangeCircle) {
        map.removeLayer(rangeCircle);  // 移除之前的範圍
    }

    selectedMarker = L.marker(e.latlng).addTo(map);  // 在點選的位置添加標記

    // 當選擇點選後，顯示範圍輸入框
    document.getElementById('distance').style.display = 'block';

    // 當使用者輸入範圍值後，更新範圍顯示
    document.getElementById('range').addEventListener('input', function () {
        const rangeValue = parseFloat(this.value);
        if (!isNaN(rangeValue)) {
            if (rangeCircle) {
                map.removeLayer(rangeCircle);  // 移除之前的圓形
            }
            // 在選定點周圍繪製圓形，單位是米，因此範圍要轉換為公里乘以1000
            rangeCircle = L.circle(e.latlng, {
                radius: rangeValue * 1000,  // 將公里轉換為米
                color: 'blue',
                fillColor: '#add8e6',
                fillOpacity: 0.5
            }).addTo(map);
        }
    });
});

// 從 scale-data.json 讀取磅秤資料並在地圖上顯示
fetch('scale-data.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
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
        updateInfoControl();
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });

// 從 weighbridge-data.json 讀取地磅資料並在地圖上顯示
fetch('weighbridge-data.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
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
        updateInfoControl();
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });



