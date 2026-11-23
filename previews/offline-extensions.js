(function (window) {
  'use strict';

  const field = id => document.getElementById(id);
  const value = id => field(id)?.value?.trim() || '';
  const number = id => value(id) === '' ? null : Number(value(id));
  const hasValue = object => Object.values(object).some(item => item !== null && item !== '');

  function collectCanonicalExtensions(report, idPrefix) {
    const extensions = [];
    const tags = {
      cropObservations: 'crop',
      weatherObservations: 'weather',
      soilObservations: 'soil',
      irrigationObservations: 'irrigation',
      stops: 'stop',
    };
    const add = (domain, body) => extensions.push({
      domain,
      body: { id: `${idPrefix.slice(0, 38)}-${tags[domain]}`, ...body },
    });

    const crop = {
      growth_stage: report.growthStage,
      plant_height: number('plant-height'),
      plant_population: number('plant-population'),
      row_width: number('row-width'),
      plant_spacing: number('plant-spacing'),
      vigour: value('vigour'),
      notes: '',
    };
    if (hasValue(crop)) add('cropObservations', crop);

    const weather = {
      observed_at: `${report.reportDate}T12:00:00`,
      temperature_c: report.temperature,
      humidity_percent: report.humidity,
      wind_speed: number('wind-speed'),
      wind_direction: value('wind-direction'),
      cloud_cover: value('cloud-cover'),
      rainfall_mm: number('rainfall-mm'),
      leaf_wetness: value('leaf-wetness'),
      source: 'Scout Report Form',
    };
    if (hasValue({ ...weather, observed_at: '', source: '' })) add('weatherObservations', weather);

    const soil = {
      moisture_status: value('soil-moisture-status'),
      moisture_percent: number('soil-moisture-percent'),
      ph: number('soil-ph'),
      ec: number('soil-ec'),
      texture: value('soil-texture'),
      drainage: value('drainage'),
      soil_temperature: number('soil-temperature'),
      notes: '',
    };
    if (hasValue(soil)) add('soilObservations', soil);

    const irrigation = {
      irrigation_method: value('irrigation-method'),
      irrigation_status: value('irrigation-status'),
      water_stress: value('water-stress'),
      notes: '',
    };
    if (hasValue(irrigation)) add('irrigationObservations', irrigation);

    if (report.location) add('stops', {
      sequence_no: 1,
      latitude: report.location.latitude,
      longitude: report.location.longitude,
      gps_accuracy_m: report.location.gpsAccuracyM,
      location_label: report.fieldName,
      sampling_method: 'GPS',
      notes: '',
    });

    return extensions;
  }

  window.collectCanonicalExtensions = collectCanonicalExtensions;
})(window);
