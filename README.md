# Spatially-Explicit Uncertainty of the Satellite–Air Temperature Discrepancy (ΔT) across the Urban–Rural Gradient in Flanders

A GeoConformal mini-study applying model-agnostic, spatially-explicit uncertainty
quantification to the discrepancy between satellite land surface temperature and
reanalysis air temperature.

## Overview

This study applies **GeoConformal prediction** (Lou, Luo & Meng, 2025) to the
discrepancy **ΔT = LST − T2m** (satellite skin temperature minus reanalysis air
temperature) across Flanders, Belgium. An intentionally *aspatial* Random Forest
predicts ΔT from surface properties (NDVI, land use); GeoConformal then wraps the
fitted model to produce **spatially-varying prediction intervals**, so geography
enters only through distance-weighted calibration of nearby residuals (Tobler's
first law).

The goal is not predictive accuracy but **reliability mapping** — showing where ΔT
predictions can be trusted, validating empirical coverage, and probing what such a
map actually represents.

## Key findings

- **GeoConformal validates and adapts.** At a 20 km kernel bandwidth, empirical
  coverage is 0.90 (target 0.90). Interval half-width varies 4.5–9.8 °C across space,
  while ordinary conformal prediction is flat at 7.0 °C — the same *average* coverage
  and width, but redistributed spatially.
- **A predictor that looked physical was a spatial proxy.** Elevation (DEM) received
  high feature importance (0.32) but correlated r = −0.61 with latitude in this flat
  region; it was removed to keep the baseline model genuinely aspatial.
- **Low R² is appropriate here, not a failure.** Surface predictors alone explain
  ~7 % of ΔT variance (R² = 0.07) — expected at 100 m given sub-pixel surface detail
  and the coarse (~9 km) ERA5 support. Substantial, spatially-structured residual
  error is precisely what makes uncertainty quantification meaningful.
- **A reliability map is not automatically a physical map.** A tempting west–east
  reliability gradient is shown to be an artefact of GeoConformal's reliance on the
  *tails* of calibration residuals (90th-percentile: 7.56 °C west vs 5.81 °C east,
  despite near-identical medians), not a physical difference. Spatial uncertainty
  maps must be cross-checked against the residuals before interpretation.

## Pipeline

1. **Phase 1 — Data preparation.** Align LST, NDVI, DEM, ERA5-Land T2m and land use
   to a common 100 m EPSG:3035 grid; compute ΔT; sample 1,000 urban-biased points
   (complete-case AND-masking).
2. **Phase 2 — Modeling.** Aspatial Random Forest for ΔT; diagnostic removal of DEM;
   physical-plausibility check of the weak model.
3. **Phase 3 — Uncertainty quantification.** GeoConformal: bandwidth sweep, coverage
   validation vs ordinary CP, full-grid reliability map, and interpretation caution.

## Data

- **Landsat 8/9 Collection 2 Level 2** — LST, NDVI (Google Earth Engine), warm season 2021
- **Copernicus DEM GLO-30** (Google Earth Engine)
- **ERA5-Land** 2 m air temperature, warm-season 09:00 UTC mean (Copernicus CDS)
- **Landgebruik Vlaanderen 2022** land use (vlaanderen.be), reclassified 19 → 5 classes

## Files

- `Mini_Research_Project.ipynb` — full analysis (data prep → modeling → uncertainty)
- `figures/` — sample distribution and reliability map
- Raw rasters and the ERA5 retrieval file are not included (sources documented in the notebook)

## How to run

The notebook runs top-to-bottom in Google Colab. Input rasters and the ERA5 file are
expected in a Google Drive folder (`BASE` path set at the top of the notebook). Data
retrieval (Google Earth Engine + Copernicus CDS) is documented in the notebook header.
The `geoconformal` package is installed in Phase 3.

## References

- Lou, X., Luo, P., & Meng, L. (2025). GeoConformal Prediction: A Model-Agnostic Framework for Measuring the Uncertainty of Spatial Prediction. *Annals of the American Association of Geographers*, 115(8), 1971–1998. https://doi.org/10.1080/24694452.2025.2516091
- Angelopoulos, A. N., & Bates, S. (2023). Conformal Prediction: A Gentle Introduction. *Foundations and Trends in Machine Learning*, 16(4), 494–591. https://doi.org/10.1561/2200000101
- Tobler, W. R. (1970). A Computer Movie Simulating Urban Growth in the Detroit Region. *Economic Geography*, 46, 234–240. https://doi.org/10.2307/143141
- Haesen, S., Lembrechts, J. J., De Frenne, P., et al. (2023). ForestClim — Bioclimatic variables for microclimate temperatures of European forests. *Global Change Biology*, 29, 2886–2892. https://doi.org/10.1111/gcb.16678
- Copernicus Climate Change Service (C3S) (2019). ERA5-Land hourly data from 1950 to present. Copernicus Climate Change Service Climate Data Store.