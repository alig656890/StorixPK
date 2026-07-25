/**
 * StorixPK — Checkout stock updater
 * ----------------------------------------------------------------
 * Deploy this bound to your product spreadsheet (the same one
 * product.js reads from). It receives each order from checkout.js
 * and:
 *   1. decreases "In Stock"      (column M / index 13)
 *   2. increases "Sold Quantity" (column L / index 12)
 *   3. increases "Total Sold"    (column N / index 14)
 *   4. increases "Total Purchased" (column K / index 11)
 *   5. logs the order on an "Orders" sheet (created automatically)
 *
 * Sheet column layout this expects (0-indexed, matches product.js):
 * 0 Type  1 Picture  2 name  3 short description  4 Price With Discount
 * 5 Original Price  6 Product Unique ID  7 long description  8 Status
 * 9 Seller No  10 Total Purchased  11 Sold Quantity  12 In Stock
 * 13 Total Sold  14 Rating  15 Review Count  16 Size  17 Material
 * 18 Shipping Cost  19 Limited Stock
 *
 * SETUP
 * 1. Open the product spreadsheet in Google Sheets.
 * 2. Extensions → Apps Script.
 * 3. Delete any starter code, paste this whole file in, save.
 * 4. Deploy → New deployment → type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web app URL it gives you.
 * 6. Paste that URL into APPS_SCRIPT_URL at the top of checkout.js.
 */

const PRODUCT_SHEET_NAME = null; // set a sheet name (string) if your data isn't on the first sheet
const ID_COLUMN_INDEX = 6;       // "Product Unique ID" — 0-indexed
const TOTAL_PURCHASED_INDEX = 10;
const SOLD_QTY_INDEX = 11;
const IN_STOCK_INDEX = 12;
const TOTAL_SOLD_INDEX = 13;

function doPost(e){
    try{
        const payload = JSON.parse(e.postData.contents);
        updateStock(payload.items || []);
        logOrder(payload);
        return ContentService
            .createTextOutput(JSON.stringify({ ok: true }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch(err){
        return ContentService
            .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function getProductSheet(){
    const ss = SpreadsheetApp.getActive();
    return PRODUCT_SHEET_NAME ? ss.getSheetByName(PRODUCT_SHEET_NAME) : ss.getSheets()[0];
}

function updateStock(items){
    if(!items.length) return;

    const sheet = getProductSheet();
    const data = sheet.getDataRange().getValues();

    items.forEach(({ id, qty }) => {
        for(let row = 1; row < data.length; row++){
            if(String(data[row][ID_COLUMN_INDEX]).trim() === String(id).trim()){
                const sheetRow = row + 1; // 1-indexed for getRange

                const currentStock = Number(data[row][IN_STOCK_INDEX]) || 0;
                const currentSoldQty = Number(data[row][SOLD_QTY_INDEX]) || 0;
                const currentTotalSold = Number(data[row][TOTAL_SOLD_INDEX]) || 0;
                const currentTotalPurchased = Number(data[row][TOTAL_PURCHASED_INDEX]) || 0;

                sheet.getRange(sheetRow, IN_STOCK_INDEX + 1).setValue(Math.max(0, currentStock - qty));
                sheet.getRange(sheetRow, SOLD_QTY_INDEX + 1).setValue(currentSoldQty + qty);
                sheet.getRange(sheetRow, TOTAL_SOLD_INDEX + 1).setValue(currentTotalSold + qty);
                sheet.getRange(sheetRow, TOTAL_PURCHASED_INDEX + 1).setValue(currentTotalPurchased + qty);
                break;
            }
        }
    });
}

function logOrder(payload){
    const ss = SpreadsheetApp.getActive();
    let ordersSheet = ss.getSheetByName("Orders");

    if(!ordersSheet){
        ordersSheet = ss.insertSheet("Orders");
        ordersSheet.appendRow(["Order ID", "Date", "Customer Name", "Phone", "Total", "Items"]);
    }

    const itemsSummary = (payload.items || [])
        .map(i => `${i.id} x${i.qty}`)
        .join(", ");

    ordersSheet.appendRow([
        payload.orderId || "",
        payload.date || new Date().toISOString(),
        payload.customerName || "",
        payload.customerPhone || "",
        payload.total || 0,
        itemsSummary
    ]);
}
