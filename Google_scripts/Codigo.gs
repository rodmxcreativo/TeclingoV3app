/**
 * 🌐 TECNOLINGO AI - ENGINE API REST (PRODUCCIÓN ADAPTADA A CONTRATO FRONTEND)
 * ID del Spreadsheet: 1dO4oe116BIjn8RfTYEvuQ_4fIbfkCMtsIr86khMTf50
 */

const SPREADSHEET_ID = "1dO4oe116BIjn8RfTYEvuQ_4fIbfkCMtsIr86khMTf50";

// Utilidad oficial para empaquetar respuestas JSON nativas
function construirRespuestaJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

// Soporte obligatorio para pre-verificaciones del navegador (OPTIONS)
function doOptions(e) {
  return construirRespuestaJSON({ success: true });
}

/**
 * 📥 MANEJADOR PRINCIPAL (POST)
 * Cumple estrictamente con el contrato: 
 * Request: { action: "getAll"|"getById"|"create"|"update"|"delete", sheet: "...", id?: "...", data?: {...} }
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const postData = JSON.parse(e.postData.contents);
    
    const action = postData.action;
    const sheetName = postData.sheet;
    const targetId = postData.id;
    const bodyData = postData.data || {};
    
    if (!sheetName) {
      return construirRespuestaJSON({ success: false, error: "El parámetro 'sheet' es requerido." });
    }
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return construirRespuestaJSON({ success: false, error: "La tabla '" + sheetName + "' no existe." });
    }
    
    // Obtener rangos base de la hoja
    const fullData = sheet.getDataRange().getValues();
    const headers = fullData[0];
    const idIndex = headers.indexOf("id") !== -1 ? headers.indexOf("id") : 0;
    
    // --- 1. ACCIÓN: getAll ---
    if (action === "getAll") {
      if (fullData.length <= 1) return construirRespuestaJSON({ success: true, data: [] });
      
      const rows = fullData.slice(1);
      const dataMapped = rows.map(row => {
        let obj = {};
        headers.forEach((header, index) => { obj[header] = row[index]; });
        return obj;
      });
      
      return construirRespuestaJSON({ success: true, data: dataMapped });
    }
    
    // --- 2. ACCIÓN: getById ---
    if (action === "getById") {
      if (!targetId) return construirRespuestaJSON({ success: false, error: "Se requiere un 'id' para getById." });
      if (fullData.length <= 1) return construirRespuestaJSON({ success: true, data: null });
      
      const rows = fullData.slice(1);
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][idIndex]) === String(targetId)) {
          let obj = {};
          headers.forEach((header, idx) => { obj[header] = rows[i][idx]; });
          return construirRespuestaJSON({ success: true, data: obj });
        }
      }
      return construirRespuestaJSON({ success: true, data: null });
    }
    
    // --- 3. ACCIÓN: create ---
    if (action === "create") {
      // Inyección de ID de seguridad por si el front no lo manda
      if (!bodyData.id) {
        bodyData.id = targetId || "TL-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      }
      const newRow = headers.map(header => bodyData[header] !== undefined ? bodyData[header] : "");
      sheet.appendRow(newRow);
      return construirRespuestaJSON({ success: true, data: { id: bodyData.id } });
    }
    
    // --- 4. ACCIÓN: update ---
    if (action === "update") {
      if (!targetId) return construirRespuestaJSON({ success: false, error: "ID requerido para actualización." });
      
      for (let i = 1; i < fullData.length; i++) {
        if (String(fullData[i][idIndex]) === String(targetId)) {
          headers.forEach((header, colIdx) => {
            if (bodyData[header] !== undefined) {
              sheet.getRange(i + 1, colIdx + 1).setValue(bodyData[header]);
            }
          });
          return construirRespuestaJSON({ success: true, data: { id: targetId } });
        }
      }
      return construirRespuestaJSON({ success: false, error: "Registro no encontrado para actualizar." });
    }
    
    // --- 5. ACCIÓN: delete ---
    if (action === "delete" || action === "remove") {
      if (!targetId) return construirRespuestaJSON({ success: false, error: "ID requerido para eliminación." });
      
      for (let i = 1; i < fullData.length; i++) {
        if (String(fullData[i][idIndex]) === String(targetId)) {
          sheet.deleteRow(i + 1);
          return construirRespuestaJSON({ success: true, message: "Registro eliminado con éxito." });
        }
      }
      return construirRespuestaJSON({ success: false, error: "Registro no encontrado para eliminar." });
    }
    
    return construirRespuestaJSON({ success: false, error: "Acción '" + action + "' no soportada por el backend." });
    
  } catch (error) {
    return construirRespuestaJSON({ success: false, error: error.toString() });
  }
}

/**
 * 📥 MANEJADOR COMPLEMENTARIO (GET)
 * Se mantiene como respaldo ligero para pruebas desde el navegador.
 */
function doGet(e) {
  return construirRespuestaJSON({ 
    status: "online", 
    message: "TECNOLINGO AI API está activa. Usa solicitudes POST desde la app para interactuar con la data." 
  });
}