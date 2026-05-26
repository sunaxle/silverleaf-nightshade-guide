/**
 * Google Apps Script for Silverleaf Nightshade Data Collection
 * 
 * Instructions:
 * 1. Go to Google Sheets and create a new spreadsheet.
 * 2. Name the first sheet "Data".
 * 3. Add the following headers to the first row (A1 to R1):
 *    Date, Site, Treatment, Coordinates, Dist_From_Road, Temperature, Drought Stress, Soil_Compaction, Plant Stage, Percent_Cover, Plant Height, Damage Score, Spine Density, Open_Flowers, Insect, Count, Fecundity, Notes
 * 4. Click Extensions > Apps Script.
 * 5. Paste this entire code into Code.gs, replacing any existing code.
 * 6. Click Deploy > New deployment.
 * 7. Select type "Web app".
 * 8. Execute as: "Me", Who has access: "Anyone".
 * 9. Click Deploy and authorize the script.
 * 10. Copy the "Web app URL" and paste it into data_collection.html where indicated.
 */

function doPost(e) {
  try {
    // Open the spreadsheet that this script is bound to, or by ID if standalone
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
    
    // Extract parameters from the POST request
    var date = e.parameter.date || "";
    var site = e.parameter.site || "";
    var treatment = e.parameter.treatment || "";
    var coordinates = e.parameter.coordinates || "";
    var distanceFromRoad = e.parameter.distanceFromRoad || "";
    var temperature = e.parameter.temperature || "";
    var droughtStress = e.parameter.droughtStress || "";
    var soilCompaction = e.parameter.soilCompaction || "";
    var plantStage = e.parameter.plantStage || "";
    var percentCover = e.parameter.percentCover || "";
    var plantHeight = e.parameter.plantHeight || "";
    var damageScore = e.parameter.damageScore || "";
    var spineDensity = e.parameter.spineDensity || "";
    var openFlowers = e.parameter.openFlowers || "";
    var insect = e.parameter.insect || "";
    var count = e.parameter.count || "";
    var fecundity = e.parameter.fecundity || "";
    var notes = e.parameter.notes || "";
    
    // Append the row to the sheet
    sheet.appendRow([date, site, treatment, coordinates, distanceFromRoad, temperature, droughtStress, soilCompaction, plantStage, percentCover, plantHeight, damageScore, spineDensity, openFlowers, insect, count, fecundity, notes]);
    
    // Return a success JSON response
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return an error JSON response if something fails
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (useful for pinging the URL to verify it's working)
function doGet(e) {
  return ContentService.createTextOutput("The Silverleaf Nightshade Data Collection Web App is running.");
}
