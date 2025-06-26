// 日期轉換函式，放在最頂部
function convertToISODate(rocDate) {
    // 檢查輸入是否為有效數字
    if (!rocDate || isNaN(rocDate)) {
        return null; // 若格式不正確，回傳 null
    }

    // 解析數字
    const year = Math.floor(rocDate / 10000) + 1911; // 提取年份並轉為西元
    const month = Math.floor((rocDate % 10000) / 100); // 提取月份
    const day = rocDate % 100; // 提取日期

    // 將日期組合成YYYY-MM-DD 格式
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 初始化 Leaflet 地圖，中心點設為台灣
const map = L.map('map').setView([25.03236, 121.51813], 10);

// 添加 WMTS 國土測繪底圖
L.tileLayer(
    'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}.jpeg',
    {
        attribution: '臺灣通用電子地圖',
        maxZoom: 20,
        tileSize: 256,
        format: 'image/jpeg',
    }
).addTo(map);


map.zoomControl.remove(); // 移除內建的縮放控制器
// 修改放大縮小控制項位置到左下角
L.control.zoom({ position: 'bottomleft' }).addTo(map);

// 新增「度量衡器地圖」標題框（左上角）
const titleControl = L.control({ position: 'topleft' });

titleControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'leaflet-control-title');
    div.innerHTML = `
        <div style="text-align: center;">
            <span style="font-size: 24px; display: block;">臺      灣</span>
            <h2 style="margin: 0; font-size: 24px;">   度 量 衡 器 地 圖   </h2>
        </div>`;
    return div;
};
titleControl.addTo(map);


// 自訂篩選控制項
const filterControl = L.control({ position: 'topleft' });

filterControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'leaflet-control-filter');
    div.innerHTML = `
        <div class="json-upload-section">
            <div class="json-upload-header" id="json-upload-header-toggle">
                <h4>載入JSON資料檔案</h4>
                <span id="toggle-json-icon" class="json-upload-toggle-icon">&#9660;</span> </div>
            <div class="json-upload-content" id="json-upload-content">
                <label for="file-scale">非自動衡器資料：</label>
                <input type="file" id="file-scale" accept=".json"><br>

                <label for="file-weighbridge">固定地秤資料：</label>
                <input type="file" id="file-weighbridge" accept=".json"><br>
                
                <label for="file-tankscale">非連續累計自動衡器資料：</label>
                <input type="file" id="file-tankscale" accept=".json"><br>

                <label for="file-loadingscale">重力式自動裝料衡器資料：</label>
                <input type="file" id="file-loadingscale" accept=".json"><br>

                <label for="file-dispenser">油量計資料：</label>
                <input type="file" id="file-dispenser" accept=".json"><br>

                <label for="file-gasmachine">液化石油氣流量計資料：</label>
                <input type="file" id="file-gasmachine" accept=".json"><br>

                <label for="file-charger">電動車輛供電設備資料：</label>
                <input type="file" id="file-charger" accept=".json"><br>

                <label for="file-sc_speed">區間平均速率裝置資料：</label>
                <input type="file" id="file-sc_speed" accept=".json"><br>

                <label for="file-ex_scale">優良衡器管理市場資料：</label>
                <input type="file" id="file-ex_scale" accept=".json"><br>

                <label for="file-ex_dispenser">優良油量計加油站資料：</label>
                <input type="file" id="file-ex_dispenser" accept=".json"><br>
            </div>
        </div>
        
        <hr> <label for="city-filter">縣市：</label>
        <select id="city-filter" multiple>
            <option value="all">全部縣市</option>
            <option value="基隆市">基隆市</option>
            <option value="宜蘭縣">宜蘭縣</option>
            <option value="新北市">新北市</option>
            <option value="臺北市">臺北市</option>
            <option value="桃園市">桃園市</option>
            <option value="新竹市">新竹市</option>
            <option value="新竹縣">新竹縣</option>
            <option value="苗栗縣">苗栗縣</option>
            <option value="臺中市">臺中市</option>
            <option value="南投縣">南投縣</option>
            <option value="彰化縣">彰化縣</option>
            <option value="雲林縣">雲林縣</option>
            <option value="嘉義市">嘉義市</option>
            <option value="嘉義縣">嘉義縣</option>
            <option value="臺南市">臺南市</option>
            <option value="高雄市">高雄市</option>
            <option value="屏東縣">屏東縣</option>
            <option value="花蓮縣">花蓮縣</option>
            <option value="臺東縣">臺東縣</option>
            <option value="澎湖縣">澎湖縣</option>
            <option value="金門縣">金門縣</option>
            <option value="連江縣">連江縣</option>
        </select>

        <label for="layer-filter">度量衡器：</label>
        <select id="layer-filter">
            <option value="all">全部</option>
            <option value="scale">非自動衡器</option>
            <option value="weighbridge">固定地秤</option>
            <option value="tankscale">非連續累計自動衡器</option>
            <option value="loadingscale">重力式自動裝料衡器</option>
            <option value="dispenser">油量計</option>
            <option value="gasmachine">液化石油氣流量計</option>
            <option value="charger">電動車輛供電設備</option>
            <option value="sc_speed">區間平均速率裝置</option>
            <option value="ex_scale">優良衡器計量管理市場</option>
            <option value="ex_dispenser">優良油量計計量管理加油站</option>
        </select>
        <br>
        <label for="inspection-result">檢查結果：</label>
        <select id="inspection-result">
            <option value="all">全部</option>
            <option value="qualified">合格</option>
            <option value="unqualified">不合格</option>
            <option value="have">有</option>
            <option value="none">無</option>
        </select>
        <br>
        <label for="start-date">檢定檢查起始日(如1130820):</label>
        <input type="text" id="start-date" placeholder="輸入國曆">
        <br>
        <label for="end-date">檢定檢查結束日:</label>
        <input type="text" id="end-date" placeholder="輸入國曆">
        <br>
        <label for="deadline-date">檢定/優良期限日-逾越:</label>
        <input type="text" id="deadline-date" placeholder="輸入國曆">
        <br>
        <button id="apply-filter">統計篩選</button>
    `;
    
    L.DomEvent.disableClickPropagation(div);

    // **新增：JSON 載入區塊的收合/展開功能**
    const jsonUploadHeader = div.querySelector('#json-upload-header-toggle');
    const jsonUploadContent = div.querySelector('#json-upload-content');
    const toggleIcon = div.querySelector('#toggle-json-icon');

    // 預設為收合狀態
    jsonUploadContent.classList.remove('expanded'); 
    toggleIcon.innerHTML = '&#9660;'; // 向下箭頭

    if (jsonUploadHeader && jsonUploadContent && toggleIcon) {
        jsonUploadHeader.addEventListener('click', () => {
            jsonUploadContent.classList.toggle('expanded');
            if (jsonUploadContent.classList.contains('expanded')) {
                toggleIcon.innerHTML = '&#9650;'; // 向上箭頭
            } else {
                toggleIcon.innerHTML = '&#9660;'; // 向下箭頭
            }
        });
    }

    // 監聽篩選按鈕點擊事件 (保持原有邏輯不變)
    const applyFilterButton = div.querySelector('#apply-filter');
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', async () => {
            console.log('開始載入使用者選擇的資料...');
            try {
                await Promise.all([
                    loadFile('file-scale', scaleData),
                    loadFile('file-weighbridge', weighbridgeData),
                    loadFile('file-tankscale', tankscaleData),
                    loadFile('file-loadingscale', loadingscaleData),
                    loadFile('file-dispenser', dispenserData),
                    loadFile('file-gasmachine', gasmachineData),
                    loadFile('file-charger', chargerData),
                    loadFile('file-sc_speed', sc_speedData),
                    loadFile('file-ex_scale', ex_scaleData),
                    loadFile('file-ex_dispenser', ex_dispenserData)
                ]);
                console.log('所有選定的資料檔案已嘗試載入完畢。');
                processFilters(); 
            } catch (error) {
                console.error('載入部分資料檔案時發生錯誤:', error);
                processFilters();
            }
        });
    }

    return div;
};

// 加入控制項到地圖
filterControl.addTo(map);

// 定義叢集圖示的顏色類別和樣式
const clusterColors = {
    'scale': '#529fd3', // 藍色 (非自動衡器)
    'weighbridge': '#39ba30', // 綠色 (固定地秤)
    'tankscale': '#b0e51f', // 亮綠色 (非連續累計自動衡器)
    'loadingscale': '#b988ab', // 紫色 (重力式自動裝料衡器)
    'dispenser': '#b3b8f7', // 亮紫色 (油量計) 
    'gasmachine': '#fea021', // 橘色 (液化石油氣流量計)
    'charger': '#a94fd3', // 深紫色 (電動車輛供電設備)
    'sc_speed': '#cec63d', // 駝色 (區間平均速率裝置)
    'ex_scale': '#fed939', // 金色 (優良衡器計量管理市場)
    'ex_dispenser': '#cca22a' // 棕色 (優良油量計計量管理加油站)
};
// 修正後的叢集圖示生成函式：只根據傳入的固定顏色顯示，大小仍依數量變化
function createCustomClusterIcon(fixedColor) { 
    return function (cluster) {
        const count = cluster.getChildCount();
        let sizeClass = 'small'; 
        if (count >= 10 && count < 100) {
            sizeClass = 'medium';
        } else if (count >= 100) {
            sizeClass = 'large';
        }

        return L.divIcon({
            html: `<div style="background-color: ${fixedColor};" class="cluster-icon ${sizeClass}">${count}</div>`,
            className: 'marker-cluster', 
            iconSize: L.point(40, 40) 
        });
    };
}


const scaleLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.scale),
    
});
const weighbridgeLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.weighbridge),
    
});
const tankscaleLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.tankscale),
    
});
const loadingscaleLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.loadingscale),
    
});
const dispenserLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.dispenser),
    
});
const gasmachineLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.gasmachine),
    
});
const chargerLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.charger),
    
});
const sc_speedLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.sc_speed),
    
});
const ex_scaleLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.ex_scale),
    
});
const ex_dispenserLayer = L.markerClusterGroup({
    maxClusterRadius: 80,
    iconCreateFunction: createCustomClusterIcon(clusterColors.ex_dispenser),
    
});


// 定義自定義圖示
const greenIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const blueIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const camelIcon = L.icon({
    iconUrl: 'images/camel-brown.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const goldIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-gold.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const yellowIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const lightpurpleIcon = L.icon({
    iconUrl: 'images/light-purple.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const orangeIcon = L.icon({
    iconUrl: 'images/sun-orange.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const violetIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-violet.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const redIcon = L.icon({
    iconUrl: 'images/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const d_purpleIcon = L.icon({
    iconUrl: 'images/dark-purple.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const l_greenIcon = L.icon({
    iconUrl: 'images/light-sun-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});


// 加入圖層控制 所有層
const baseLayers = {};
const overlays = {
    "非自動衡器": scaleLayer,
    "固定地秤": weighbridgeLayer,
    "非連續累計自動衡器": tankscaleLayer,
    "重力式自動裝料衡器": loadingscaleLayer,
    "油量計": dispenserLayer,
    "液化石油氣流量計": gasmachineLayer,
    "電動車輛供電設備": chargerLayer,
    "區間平均速率裝置": sc_speedLayer,
    "優良衡器計量管理市場": ex_scaleLayer,
    "優良油量計計量管理加油站": ex_dispenserLayer
};
L.control.layers(baseLayers, overlays).addTo(map);

// 初始化數量 所有層
let scaleCount = 0;
let weighbridgeCount = 0;
let tankscaleCount = 0;
let loadingscaleCount = 0;
let dispenserCount = 0;
let gasmachineCount = 0;
let chargerCount = 0;
let sc_speedCount = 0;
let ex_scaleCount = 0;
let ex_dispenserCount = 0;

// 計算磅秤、地磅、加油機、充電樁、區間測速、優良磅秤、優良加油站的數量並顯示在右下角
const infoControl = L.control({ position: 'bottomright' });
infoControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'leaflet-control-info');
    div.innerHTML = `<b>數量統計<br><b>非自動衡器：</b> ${scaleCount}<br><b>固定地秤：</b> ${weighbridgeCount}<br><b>非連續累計自動衡器：</b> ${tankscaleCount}<br><b><b>重力式自動裝料衡器：</b> ${loadingscaleCount}<br>油量計：</b> ${dispenserCount}<br><b>液化石油氣流量計：</b> ${gasmachineCount}<br><b>電動車輛供電設備：</b> ${chargerCount}<br><b>區間平均速率裝置：</b> ${sc_speedCount}<br><b>優良衡器計量管理市場：</b> ${ex_scaleCount}<br><b>優良油量計計量管理加油站：</b> ${ex_dispenserCount}`;
    return div;
};
infoControl.addTo(map);

// 更新數量顯示
function updateInfoControl() {
    const infoDiv = document.querySelector('.leaflet-control-info');
    if (infoDiv) {
        infoDiv.innerHTML = `<b>數量統計<br><b>非自動衡器：</b> ${scaleCount}<br><b>固定地秤：</b> ${weighbridgeCount}<br><b>非連續累計自動衡器：</b> ${tankscaleCount}<br><b>重力式自動裝料衡器：</b> ${loadingscaleCount}<br><b>油量計：</b> ${dispenserCount}<br><b>液化石油氣流量計：</b> ${gasmachineCount}<br><b>電動車輛供電設備：</b> ${chargerCount}<br><b>區間平均速率裝置：</b> ${sc_speedCount}<br><b>優良衡器計量管理市場：</b> ${ex_scaleCount}<br><b>優良油量計計量管理加油站：</b> ${ex_dispenserCount}`;
    }
}

// 讀取 JSON 資料 所有圖層 - 現在變為空陣列，等待使用者載入
let scaleData = [];
let weighbridgeData = [];
let tankscaleData = [];
let loadingscaleData = [];
let dispenserData = [];
let gasmachineData = [];
let chargerData = [];
let sc_speedData = [];
let ex_scaleData = [];
let ex_dispenserData = [];

// 新增一個輔助函數來處理檔案讀取
function loadFile(fileInputId, dataArrayRef) {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        // 如果元素不存在，直接解決 Promise 並警告
        if (!fileInput) {
            console.warn(`HTML 元素 #${fileInputId} 不存在。`);
            dataArrayRef.splice(0, dataArrayRef.length); // 清空陣列
            resolve([]);
            return;
        }

        if (!fileInput.files || fileInput.files.length === 0) {
            console.warn(`未選擇 ${fileInputId} 的檔案，將跳過此圖層的載入。`);
            dataArrayRef.splice(0, dataArrayRef.length); // 清空陣列
            resolve([]); // 解決 Promise，回傳空陣列
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                // 直接更新傳入的資料陣列引用
                dataArrayRef.splice(0, dataArrayRef.length, ...data); 
                console.log(`${fileInputId} 檔案載入成功，資料筆數: ${data.length}`);
                resolve(data);
            } catch (error) {
                console.error(`解析 ${file.name} 失敗:`, error);
                dataArrayRef.splice(0, dataArrayRef.length); // 清空陣列
                reject(error);
            }
        };

        reader.onerror = function(e) {
            console.error(`讀取 ${file.name} 失敗:`, e);
            dataArrayRef.splice(0, dataArrayRef.length); // 清空陣列
            reject(e);
        };

        reader.readAsText(file);
    });
}


function processFilters() { 
    // 清空圖層與計數
    scaleLayer.clearLayers();
    weighbridgeLayer.clearLayers();
    tankscaleLayer.clearLayers();
    loadingscaleLayer.clearLayers();
    dispenserLayer.clearLayers();
    gasmachineLayer.clearLayers();
    chargerLayer.clearLayers();
    sc_speedLayer.clearLayers();
    ex_scaleLayer.clearLayers();
    ex_dispenserLayer.clearLayers();
    

    scaleCount = 0;
    weighbridgeCount = 0;
    tankscaleCount = 0;
    loadingscaleCount = 0;
    dispenserCount = 0;
    gasmachineCount = 0;
    chargerCount = 0;
    sc_speedCount = 0;
    ex_scaleCount = 0;
    ex_dispenserCount = 0;

    // 獲取多選的縣市，並將 "台" 統一轉換為 "臺"
    const selectedCities = Array.from(document.getElementById('city-filter').selectedOptions)
                                    .map(option => option.value.replace(/台/g, '臺'));
    const selectedLayer = document.getElementById('layer-filter').value;
    const selectedInspectionResult = document.getElementById('inspection-result').value;
    // 判斷是否選擇了「全部縣市」////
    const isAllCities = selectedCities.includes("all");
    // 獲取國曆格式的起始與結束日期並轉換為 ISO 格式
    const rocStartDate = document.getElementById('start-date').value; // 國曆輸入
    const rocEndDate = document.getElementById('end-date').value;      // 國曆輸入
    const rocDeadlineDate = document.getElementById('deadline-date').value; // 新增的期限日期

    const startDate = rocStartDate ? convertToISODate(parseInt(rocStartDate)) : null;
    const endDate = rocEndDate ? convertToISODate(parseInt(rocEndDate)) : null;
    const deadlineDate = rocDeadlineDate ? convertToISODate(parseInt(rocDeadlineDate)) : null;

    const startTimestamp = startDate ? Date.parse(startDate) : null;
    const endTimestamp = endDate ? Date.parse(endDate) : null;
    const deadlineTimestamp = deadlineDate ? Date.parse(deadlineDate) : null;


    // 輔助函式：將標記添加到對應的 MarkerClusterGroup 圖層
    function addMarkersToCorrectLayer(data, clusterLayer, markerIconFunction, popupHtmlFunction, layerName) {
        if (!data || data.length === 0) { // 如果沒有資料，直接返回 0
            console.log(`${layerName} 沒有資料可供處理。`);
            return 0;
        }

        const markersToAdd = []; // 用來暫存符合篩選條件的標記
        let currentCount = 0; // 用於計數

        data.forEach(item => {
            const cityName = item.縣市 ? item.縣市.replace(/台/g, '臺') : '';
            const inspectionResult = item.檢查合格與否 || "";
            const isResultMatched =
                selectedInspectionResult === "all" ||
                (selectedInspectionResult === "qualified" && inspectionResult === "Y") ||
                (selectedInspectionResult === "unqualified" && inspectionResult === "N") ||
                (selectedInspectionResult === "have" && (inspectionResult === "N" || inspectionResult === "Y")) ||
                (selectedInspectionResult === "none" && inspectionResult === "");
            const checkDate = item.檢查日期 ? Date.parse(convertToISODate(item.檢查日期)) : null;
            const verificationDate = item.檢定日期 ? Date.parse(convertToISODate(item.檢定日期)) : null;
            const expiryDate = item.檢定合格期限 ? Date.parse(convertToISODate(item.檢定合格期限)) : (item.優良效期 ? Date.parse(convertToISODate(item.優良效期)) : null);

            const isDateInRange =
                (!startTimestamp && !endTimestamp) ||
                (checkDate && (!startTimestamp || checkDate >= startTimestamp) && (!endTimestamp || checkDate <= endTimestamp)) ||
                (verificationDate && (!startTimestamp || verificationDate >= startTimestamp) && (!endTimestamp || verificationDate <= endTimestamp));

            const isDeadlineValid = (!deadlineTimestamp) || (expiryDate && expiryDate < deadlineTimestamp);

            let finalIsResultMatched = isResultMatched;
            if (clusterLayer === ex_scaleLayer || clusterLayer === ex_dispenserLayer) {
                finalIsResultMatched =
                    selectedInspectionResult === "all" ||
                    (selectedInspectionResult === "have" && item.優良效期) ||
                    (selectedInspectionResult === "none" && !item.優良效期);
            }

            if ((isAllCities || selectedCities.includes(cityName)) && isDateInRange && isDeadlineValid && finalIsResultMatched) {
                if (item.latitude && item.longitude) { // 檢查經緯度是否存在
                    const markerIcon = markerIconFunction(item);
                    const marker = L.marker([item.latitude, item.longitude], { icon: markerIcon });
                    marker.bindPopup(popupHtmlFunction(item));
                    markersToAdd.push(marker); // 將標記添加到暫存陣列
                    currentCount++; // 計數增加
                } else {
                    console.warn(`跳過 ${layerName} 中沒有經緯度資料的項目:`, item);
                }
            }
        });

        clusterLayer.addLayers(markersToAdd);
        console.log(`將 ${currentCount} 個標記加入到 ${layerName} 的群集圖層 (clusterLayer)。`); 

        return currentCount;
    }
    

    // 過濾並顯示磅秤資料
    if (selectedLayer === 'all' || selectedLayer === 'scale') {
        scaleCount = addMarkersToCorrectLayer(
            scaleData,
            scaleLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : blueIcon,
            (item) => `
                <h2>非自動衡器</h2>
                <b>${item.店名 || '無'}</b><br>
                廠牌: ${item.廠牌 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                Max (kg): ${item.Max_kg || '無'}<br>
                e (g): ${item.e_g || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '非自動衡器'
        );
    }

    // 過濾並顯示地磅資料
    if (selectedLayer === 'all' || selectedLayer === 'weighbridge') {
        weighbridgeCount = addMarkersToCorrectLayer(
            weighbridgeData,
            weighbridgeLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : greenIcon,
            (item) => `
                <h2>固定地秤</h2> <b>${item.所有人 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                廠牌: ${item.廠牌 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                Max (t): ${item.Max_t || '無'}<br>
                e (kg): ${item.e_kg || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '固定地秤' 
        );
    }

    // 過濾並顯示槽秤資料
    if (selectedLayer === 'all' || selectedLayer === 'tankscale') {
        tankscaleCount = addMarkersToCorrectLayer(
            tankscaleData,
            tankscaleLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : l_greenIcon,
            (item) => `
                <h2>非連續累計自動衡器</h2> <b>${item.所有人 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                廠牌: ${item.廠牌 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                Max (kg): ${item.Max_kg || '無'}<br>
                e (g): ${item.e_g || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '非連續累計自動衡器'
        );
    }

    // 過濾並顯示裝料秤資料
    if (selectedLayer === 'all' || selectedLayer === 'loadingscale') {
        loadingscaleCount = addMarkersToCorrectLayer(
            loadingscaleData,
            loadingscaleLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : d_purpleIcon,
            (item) => `
                <h2>重力式自動裝料衡器</h2> <b>${item.所有人 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                廠牌: ${item.廠牌 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                Max (kg): ${item.Max_kg || '無'}<br>
                e (g): ${item.e_g || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '重力式自動裝料衡器'
        );
    }

    // 過濾並顯示加油機資料
    if (selectedLayer === 'all' || selectedLayer === 'dispenser') {
        dispenserCount = addMarkersToCorrectLayer(
            dispenserData,
            dispenserLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : lightpurpleIcon,
            (item) => `
                <h2>油量計</h2> <b>${item.所有人 || '無'}</b><br>
                加油站名稱: ${item.加油站名稱 || '無'}<br>
                地址: ${item.地址 || '無'}<br>
                廠牌: ${item.廠牌 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                油品: ${item.油品 || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '油量計'
            
        );
    }

    // 過濾並顯示加氣機資料
    if (selectedLayer === 'all' || selectedLayer === 'gasmachine') {
        gasmachineCount = addMarkersToCorrectLayer(
            gasmachineData,
            gasmachineLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : orangeIcon,
            (item) => `
                <h2>液化石油氣流量計</h2> <b>${item.所有人 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                廠牌: ${item.廠牌 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '液化石油氣流量計'
            
        );
    }

    // 過濾並顯示充電樁地磅資料
    if (selectedLayer === 'all' || selectedLayer === 'charger') {
        chargerCount = addMarkersToCorrectLayer(
            chargerData,
            chargerLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : violetIcon,
            (item) => `
                <h2>電動車輛供電設備</h2> <b>${item.設置地點 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                樓層: ${item.樓層 || '無'}<br>
                營運商: ${item.營運商 || '無'}<br>
                製造商: ${item.製造商 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                電源型式: ${item.電源型式 || '無'}<br>
                接口型式: ${item.接口型式 || '無'}<br>
                槍別: ${item.槍別 || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '電動車輛供電設備'             
        );
    }
    

    // 過濾並顯示區間測速資料
    if (selectedLayer === 'all' || selectedLayer === 'sc_speed') {
        sc_speedCount = addMarkersToCorrectLayer(
            sc_speedData,
            sc_speedLayer,
            
            (item) => item.檢查合格與否 === 'N' ? redIcon : yellowIcon,
            (item) => `
                <h2>區間平均速率裝置</h2> <b>${item.所有人 || '無'}</b><br>
                安裝地址: ${item.安裝地址 || '無'}<br>
                製造商: ${item.製造商 || '無'}<br>
                型號: ${item.型號 || '無'}<br>
                器號: ${item.器號 || '無'}<br>
                通行距離(m): ${item.通行距離_m || '無'}<br>
                車道數: ${item.車道數 || '無'}<br>
                檢定日期: ${item.檢定日期 || '無'}<br>
                檢定合格期限: ${item.檢定合格期限 || '無'}<br>
                檢定合格單號: ${item.檢定合格單號 || '無'}<br>
                檢查日期: ${item.檢查日期 || '無'}<br>
                檢查合格(停用)單號: ${item.檢查合格_停用_單號 || '無'}<br>
                檢查合格與否: ${item.檢查合格與否 || '無'}
            `,
            '區間平均速率裝置'
            
        );
    }
    
    // 過濾並顯示優良磅秤資料
    if (selectedLayer === 'all' || selectedLayer === 'ex_scale') {
        ex_scaleCount = addMarkersToCorrectLayer(
            ex_scaleData,
            ex_scaleLayer,
            
            (item) => goldIcon,
            (item) => `
                <h2>優良衡器計量管理市場(業者)</h2>
                <b>${item.市場名稱 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                證書有效日期: ${item.證書有效日期 || '無'}
            `,
            '優良衡器計量管理市場(業者)'
            
        );
    }
    // 過濾並顯示優良加油站資料
    if (selectedLayer === 'all' || selectedLayer === 'ex_dispenser') {
        ex_dispenserCount = addMarkersToCorrectLayer(
            ex_dispenserData,
            ex_dispenserLayer,
            
            (item) => camelIcon,
            (item) => `
                <h2>優良油量計計量管理加油站</h2>
                <b>${item.加油站名稱 || '無'}</b><br>
                地址: ${item.地址 || '無'}<br>
                證書有效日期: ${item.證書有效日期 || '無'}
            `,
            '優良油量計計量管理加油站'
            
        );
    }

    // 更新數量顯示
    updateInfoControl();

    // 將所有 MarkerClusterGroup 添加到地圖
    map.eachLayer(function(layer){
        if(layer instanceof L.MarkerClusterGroup){
            map.removeLayer(layer);
        }
    });

    map.addLayer(scaleLayer);
    map.addLayer(weighbridgeLayer);
    map.addLayer(tankscaleLayer);
    map.addLayer(loadingscaleLayer);
    map.addLayer(dispenserLayer);
    map.addLayer(gasmachineLayer);
    map.addLayer(chargerLayer);
    map.addLayer(sc_speedLayer);
    map.addLayer(ex_scaleLayer);
    map.addLayer(ex_dispenserLayer);
    
}