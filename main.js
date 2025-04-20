// main.js
function getISO2Code(props) {
    const raw = props.code || props["ISO3166-1-Alpha-2"] || props["iso_3166_1"] || props["iso_3166_1_alpha_2"] || null;
    if (raw === "CN-TW") return "TW";
    return raw;
  }
  
  function getCountryName(props) {
    return props["name_en"] || props["ADMIN"] || props["name"] || "Unknown";
  }
  
  const isProd = window.location.hostname.includes('github.io') || 
                 window.location.hostname.includes('yourdomain.com') ||
                 !window.location.hostname.includes('localhost');
  
  if (isProd) {
    mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY;
  } else {
    mapboxgl.accessToken = SECRET.MAPBOX_API_KEY_DEV;
  }
  
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ko2ke/cm9q4nl5d006t01s02gas72xe',
    center: [20, 30],
    zoom: 2,
    renderWorldCopies: true
  });
  
  async function fetchStayData() {
    const res = await fetch(CONFIG.DATA_API_URL);
    return await res.json();
  }
  
  map.on('load', async () => {
    const stayData = await fetchStayData();
    const codeToDays = Object.fromEntries(stayData.map(d => [d.code, d.days]));
    const codeToPosts = Object.fromEntries(stayData.map(d => [d.code,d.instas]));
  
    const res = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
    const worldGeoJson = await res.json();
  
    const enhancedGeoJson = {
      type: 'FeatureCollection',
      features: worldGeoJson.features.map(f => {
        const code = getISO2Code(f.properties);
        const name = getCountryName(f.properties);
        const days = codeToDays[code] ?? 0;
        const urls = codeToPosts[code] ?? [];
        if (urls.length > 0) {
            console.log(urls);
        }
        return {
          ...f,
          properties: {
            ...f.properties,
            code,
            name,
            stayDays: days,
          }
        };
      })
    };
  
    map.addSource('visited-countries', {
      type: 'geojson',
      data: enhancedGeoJson
    });
  
    map.addLayer({
      id: 'visited-fill-gradient',
      type: 'fill',
      source: 'visited-countries',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'stayDays'],
          0, '#eeeeee', 10, '#4dd0e1', 30, '#00acc1', 60, '#006064'
        ],
        'fill-opacity': 0.8,
        'fill-outline-color': '#ffffff'
      }
    });

    map.addLayer({
        id: 'unvisited-outline',
        type: 'line',
        source: 'visited-countries',
        filter: ['<=', ['get', 'stayDays'], 0],
        paint: {
          'line-color': '#888888',
          'line-width': 0.5
        }
    });
  
    map.addLayer({
        id: 'visited-outline',
        type: 'line',
        source: 'visited-countries',
        filter: ['>', ['get', 'stayDays'], 0],
        paint: {
          'line-color': '#00FF88',
          'line-width': 0.5
        }
    });


  
    const labelFeatures = [];
    const seenCodes = new Set();
    enhancedGeoJson.features.forEach(f => {
      const props = f.properties;
      const code = props.code;
      const days = props.stayDays;
      const name = props.name;
      if (!seenCodes.has(code) && days > 0) {
        const center = turf.centroid(f);
        center.properties = { stayDays: days, name };
        labelFeatures.push(center);
        seenCodes.add(code);
      }
    });
  
    map.addSource('stay-labels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: labelFeatures
      }
    });
  
    map.addLayer({
      id: 'stay-days-large-label',
      type: 'symbol',
      source: 'stay-labels',
      layout: {
        'text-field': ['concat', ['get', 'stayDays'], 'd'],
        'text-font': ['Open Sans Bold'],
        'text-size': 19,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });
  
    map.on('click', 'visited-fill-gradient', (e) => {
       
      const props = e.features[0].properties;
      console.log(props);
      const code = props.code;
      const name = props.name;
      
      const urls = codeToPosts[code]?.filter(url => url.includes("instagram.com"))?.reverse() || [];
  
      const panelTitle = document.getElementById('panelTitle');
      const panelBody = document.getElementById('panelBody');
      panelTitle.innerText = name;
      panelBody.innerHTML = '';
  
      if (urls.length > 0) {
        urls.forEach(url => {
          const block = document.createElement('blockquote');
          block.className = 'instagram-media';
          block.setAttribute('data-instgrm-permalink', url);
          block.setAttribute('data-instgrm-version', '14');
          block.style = "max-width: 540px; margin: 2rem auto;";
          panelBody.appendChild(block);
        });
        if (window.instgrm) window.instgrm.Embeds.process();
      } else {
        panelBody.appendChild(document.createTextNode('No posts available.'));
      }
  
      const scrapboxLink = document.createElement('a');
      scrapboxLink.href = `https://scrapbox.io/ko2ke-log/country:${code}`;
      scrapboxLink.innerText = `View more on Scrapbox →`;
      scrapboxLink.target = '_blank';
      scrapboxLink.className = 'd-block mt-4 text-info fw-bold';
      panelBody.appendChild(scrapboxLink);
  
      const offcanvas = new bootstrap.Offcanvas(document.getElementById('infoPanel'));
      offcanvas.show();
    });
  
    map.on('mouseenter', 'visited-fill-gradient', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'visited-fill-gradient', () => {
      map.getCanvas().style.cursor = '';
    });
  
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('d-none');
  });
  