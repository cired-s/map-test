// 監聽檔案上傳輸入框的變化事件
document.getElementById('upload').addEventListener('change', handleFile, false);

// 獲取 DOM 元素以顯示狀態、錯誤和操作按鈕
const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');
const outputPre = document.getElementById('output'); // 預覽 JSON 的 <pre> 標籤
const actionButtons = document.getElementById('actionButtons');
const backButton = document.getElementById('backButton');
const runMapButton = document.getElementById('runMapButton');

// 為新按鈕添加事件監聽器
backButton.addEventListener('click', () => {
    console.log("點擊 '回上頁' 按鈕，導航到 index.html");
    window.location.href = 'index.html';
});

runMapButton.addEventListener('click', () => {
    console.log("點擊 '執行地圖程式' 按鈕，導航到 map.html");
    window.location.href = 'map.html';
});

/**
 * 處理檔案上傳事件並進行轉換
 * @param {Event} event 檔案上傳事件
 */
function handleFile(event) {
    console.log("--- handleFile 函數開始執行 ---");
    // 清除之前的訊息和按鈕狀態
    statusMessage.textContent = '';
    statusMessage.classList.add('hidden');
    errorMessage.innerHTML = '';
    errorMessage.classList.add('hidden');
    outputPre.textContent = '';
    outputPre.classList.add('hidden');
    actionButtons.classList.add('hidden');

    const file = event.target.files[0];
    if (!file) {
        console.log("未選擇檔案，handleFile 函數結束。");
        return; // 如果沒有選擇檔案，則不執行任何操作
    }
    console.log("已選擇檔案:", file.name, "檔案大小:", file.size, "bytes");

    const reader = new FileReader();
    let errors = []; // 用於收集在處理過程中遇到的所有錯誤

    reader.onload = function(e) {
        console.log("FileReader 已成功讀取檔案內容。");
        try {
            const data = new Uint8Array(e.target.result);
            console.log("已將檔案內容轉換為 Uint8Array。");

            // *** 關鍵檢查點：確認 XLSX 是否已載入 ***
            if (typeof XLSX === 'undefined') {
                console.error("錯誤: XLSX 函式庫未載入！請檢查 converter.html 中 XLSX.full.min.js 的載入路徑和狀態，以及載入順序。");
                errorMessage.innerHTML = `<strong>錯誤:</strong> XLSX 函式庫未載入。請檢查您的網路連線或 HTML 中函式庫的載入順序。`;
                errorMessage.classList.remove('hidden');
                return; // 終止函數執行
            }
            console.log("XLSX 函式庫已成功載入！"); // 只有在 XLSX 存在時才會顯示

            const workbook = XLSX.read(data, { type: 'array' });
            console.log("XLSX.read 成功讀取 Excel 檔案。工作表數量:", workbook.SheetNames.length);

            if (workbook.SheetNames.length === 0) {
                errors.push("Excel 檔案中沒有找到任何工作表。");
                console.warn("Excel 檔案中沒有找到任何工作表。");
            } else {
                // 取得第一個工作表並將其轉換為 JSON
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                console.log("已將第一個工作表轉換為 JSON 資料。資料筆數:", jsonData.length);

                // 處理欄位名稱與空白檢查
                const processedData = jsonData.map((row, rowIndex) => {
                    // 緯度與經度轉為字串並去除空白
                    row['latitude'] = row['latitude'] ? String(row['latitude']).trim() : '';
                    row['longitude'] = row['longitude'] ? String(row['longitude']).trim() : '';
                    const city = row['縣市'] ? String(row['縣市']).trim() : '';

                    // 檢查緯度
                    if (!row['latitude']) {
                        errors.push(`第 ${rowIndex + 2} 行: 緯度(latitude)為空值，請修正。`);
                    }
                    // 檢查經度
                    if (!row['longitude']) {
                        errors.push(`第 ${rowIndex + 2} 行: 經度(longitude)為空值，請修正。`);
                    }
                    // 檢查縣市
                    if (!city || city === '未知縣市') {
                        errors.push(`第 ${rowIndex + 2} 行: 縣市為 ${city || '空值'}，請修正。`);
                    }

                    // 處理所有日期欄位
                    for (const key in row) {
                        if (key.includes('日期')) {
                            const originalDate = row[key];
                            // processDate 現在會返回錯誤訊息或處理後的日期
                            const processedDateResult = processDate(originalDate, rowIndex + 2, key);
                            if (typeof processedDateResult === 'string' && processedDateResult.startsWith('錯誤')) {
                                errors.push(processedDateResult); // 如果是錯誤訊息，則添加到錯誤列表
                                row[key] = originalDate; // 保留原始值，或設定為空字串，視需求而定
                            } else {
                                row[key] = processedDateResult; // 設置處理後的日期
                            }
                        }
                    }
                    return row;
                });
                console.log("資料處理完成。錯誤數量:", errors.length);

                // 檢查是否有錯誤發生
                if (errors.length > 0) {
                    // 顯示所有錯誤訊息
                    errorMessage.innerHTML = `<strong>資料轉換錯誤:</strong><ul>${errors.map(err => `<li>${err}</li>`).join('')}</ul>請修正 Excel 檔案後重新上傳。`;
                    errorMessage.classList.remove('hidden');
                    // 不顯示成功的訊息和操作按鈕
                    statusMessage.classList.add('hidden');
                    actionButtons.classList.add('hidden');
                    outputPre.classList.add('hidden');
                    console.log("發現錯誤，已顯示錯誤訊息。");
                } else {
                    // 如果沒有錯誤，則進行下載和顯示成功訊息
                    // 顯示轉換後的 JSON 資料在頁面上 (可選)
                    outputPre.textContent = JSON.stringify(processedData, null, 2);
                    outputPre.classList.remove('hidden');
                    console.log("JSON 資料預覽已顯示。");

                    // 取得使用者選擇的資料類型
                    const selectedFileType = document.getElementById('fileType').value;

                    // 下載轉換後的 JSON 檔案
                    downloadJSON(processedData, selectedFileType);
                    console.log("JSON 檔案下載請求已發送。");

                    // 顯示已完成訊息
                    statusMessage.textContent = `已成功轉換 ${file.name} 為 ${getFileName(selectedFileType)}。`;
                    statusMessage.classList.remove('hidden');
                    
                    // 清空檔案上傳欄位以允許新的檔案上傳
                    document.getElementById('upload').value = "";
                    console.log("檔案上傳欄位已清空。");

                    // 顯示操作按鈕
                    actionButtons.classList.remove('hidden');
                    console.log("操作按鈕已顯示。");
                }
            }
        } catch (error) {
            console.error("處理檔案時發生未預期的錯誤:", error);
            errorMessage.innerHTML = `<strong>處理檔案時發生未預期的錯誤:</strong><br>${error.message}<br>請確認您的 Excel 檔案格式是否正確。`;
            errorMessage.classList.remove('hidden');
            statusMessage.classList.add('hidden');
            actionButtons.classList.add('hidden');
            outputPre.classList.add('hidden');
        }
    };

    reader.onerror = function(e) {
        console.error("FileReader 讀取檔案時發生錯誤:", e.target.error);
        errorMessage.innerHTML = `<strong>檔案讀取錯誤:</strong> ${e.target.error.message}`;
        errorMessage.classList.remove('hidden');
    };

    reader.readAsArrayBuffer(file);
    console.log("FileReader 開始讀取檔案...");
}

/**
 * 處理日期欄位，並返回處理後的日期字串或錯誤訊息
 * @param {*} date 原始日期值
 * @param {number} rowIndex 行索引（用於錯誤訊息）
 * @param {string} columnName 欄位名稱（用於錯誤訊息）
 * @returns {string} 處理後的日期字串 (YYYYMMDD) 或錯誤訊息
 */
function processDate(date, rowIndex, columnName) {
    // console.log(`處理日期: 原始值='${date}', 行=${rowIndex}, 欄位='${columnName}'`);
    if (date === null || date === undefined || String(date).trim() === '') {
        return `錯誤: 日期欄位「${columnName}」在第 ${rowIndex} 行為空值，請修正。`;
    }

    let dateString = String(date).trim(); // 確保是字串並去除空白

    // 移除不必要的 "."
    dateString = dateString.replace(/\./g, '');

    // 確保日期為 7 位數（例如：1130101）
    if (/^\d{7}$/.test(dateString)) {
        const year = dateString.slice(0, 3);
        let month = dateString.slice(3, 5);
        let day = dateString.slice(5);

        // 月份和日期補零
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');

        // console.log(`日期處理成功: ${year}${month}${day}`);
        return `${year}${month}${day}`;
    } else {
        // 如果格式不符，返回錯誤訊息
        // console.log(`日期格式不符: ${dateString}`);
        return `錯誤: 日期欄位「${columnName}」在第 ${rowIndex} 行的格式不正確 (${dateString})，應為 YYYMMDD 格式，請修正。`;
    }
}

/**
 * 將 JSON 資料轉換為 Blob 並生成下載連結
 * @param {Array<Object>} data 要下載的 JSON 資料
 * @param {string} fileType 使用者選擇的檔案類型
 */
function downloadJSON(data, fileType) {
    console.log("--- downloadJSON 函數開始執行 ---");
    const jsonStr = JSON.stringify(data, null, 2); // 將資料轉換為字串
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    console.log("已創建 Blob 和 Object URL:", url);

    // 根據選擇的類型，決定檔案名稱
    const jsonFileName = getFileName(fileType);
    console.log("決定下載檔名:", jsonFileName);

    // 創建一個隱藏的 a 標籤，用於下載 JSON 檔案
    const a = document.createElement('a');
    a.href = url;
    a.download = jsonFileName; // 檔案名稱根據使用者選擇設定
    document.body.appendChild(a);
    console.log("已創建並附加下載連結。");
    a.click(); // 自動點擊觸發下載
    document.body.removeChild(a); // 下載後刪除標籤
    URL.revokeObjectURL(url); // 釋放 URL 物件，避免記憶體洩漏
    console.log("下載完成，已移除連結並釋放 URL。");
}

/**
 * 根據資料類型取得對應的 JSON 檔名
 * @param {string} fileType 檔案類型字串
 * @returns {string} 對應的 JSON 檔名
 */
function getFileName(fileType) {
    switch (fileType) {
        case 'scale-data':
            return 'scale-data.json';
        case 'weighbridge-data':
            return 'weighbridge-data.json';
        case 'tank-data':
            return 'tank-data.json';
        case 'loading-scale-data':
            return 'loading-scale-data.json';
        case 'dispenser-data':
            return 'dispenser-data.json';
        case 'gas-machine-data':
            return 'gas-machine-data.json';
        case 'charger-data':
            return 'charger-data.json';
        case 'intervalspeed-data':
            return 'intervalspeed-data.json';
        case 'ex-management-scale-data':
            return 'ex-management-scale-data.json';
        case 'ex-management-dispenser-data':
            return 'ex-management-dispenser-data.json';
        default:
            return 'data.json'; // 預設檔案名
    }
}
