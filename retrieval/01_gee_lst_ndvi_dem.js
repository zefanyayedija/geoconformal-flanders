// ============================================================
// GeoConformal demo — Data retrieval #1 (Google Earth Engine)
// Flanders, Belgium | warm season Apr–Sep 2021
// Output: LST (°C), NDVI, DEM -> single multiband GeoTIFF
// ============================================================

// ---- 1. Region: Flanders ----
var belgium = ee.FeatureCollection('FAO/GAUL/2015/level1')
                .filter(ee.Filter.eq('ADM0_NAME', 'Belgium'));
print('ADM1 names in Belgium:', belgium.aggregate_array('ADM1_NAME'));
// Verify the Flanders string from the print above, then adjust this line if needed:
var flanders = belgium.filter(ee.Filter.eq('ADM1_NAME', 'Vlaams Gewest'));
var region = flanders.geometry();
Map.centerObject(region, 8);
// (Fallback if the name filter returns empty — use a bounding box; uncomment:)
// var region = ee.Geometry.Rectangle([2.50, 50.68, 5.95, 51.51]);

// ---- 2. Landsat 8 + 9, Collection 2 Level 2 ----
var start = '2021-04-01', end = '2021-10-01';

function prep(img){
  var qa = img.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 1).eq(0)   // dilated cloud
    .and(qa.bitwiseAnd(1 << 2).eq(0))      // cirrus
    .and(qa.bitwiseAnd(1 << 3).eq(0))      // cloud
    .and(qa.bitwiseAnd(1 << 4).eq(0));     // cloud shadow

  var nir = img.select('SR_B5').multiply(0.0000275).add(-0.2);
  var red = img.select('SR_B4').multiply(0.0000275).add(-0.2);

  // NDVI fix: drop near-zero denominators and clamp to the valid [-1, 1] range
  var denom = nir.add(red);
  var ndvi = nir.subtract(red).divide(denom)
                .updateMask(denom.abs().gt(0.01))   // remove divide-by-~0
                .clamp(-1, 1)                        // clamp to valid range
                .rename('NDVI');

  var lst = img.select('ST_B10').multiply(0.00341802).add(149.0)
                .subtract(273.15).rename('LST');     // Kelvin -> Celsius

  return ee.Image.cat([lst, ndvi]).updateMask(mask);
}

var col = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
            .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'))
            .filterBounds(region).filterDate(start, end).map(prep);
print('Number of scenes:', col.size());

// ---- 3. Median composite + DEM ----
var composite = col.median();                       // bands: LST, NDVI
var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30')
            .select('DEM').mosaic().rename('DEM');
var stack = composite.addBands(dem).clip(region);

// ---- 4. Quick visual check before export ----
Map.addLayer(stack.select('LST'),  {min:15, max:40, palette:['blue','yellow','red']}, 'LST (°C)');
Map.addLayer(stack.select('NDVI'), {min:0, max:0.8, palette:['white','green']},       'NDVI');
Map.addLayer(stack.select('DEM'),  {min:0, max:300, palette:['black','white']},       'DEM');

// ---- 5. Export to Drive (single multiband GeoTIFF) ----
Export.image.toDrive({
  image: stack.toFloat(),
  description: 'flanders_LST_NDVI_DEM_2021warm_v2',
  folder: 'geoconformal_demo',
  region: region,
  scale: 100,            // demo grid; native LST/NDVI is 30 m
  crs: 'EPSG:3035',      // ETRS-LAEA, metric (alt: EPSG:31370)
  maxPixels: 1e13
});