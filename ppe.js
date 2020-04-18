mapboxgl.accessToken = 'pk.eyJ1IjoiY3AtbGFwcGUiLCJhIjoiY2s5NG5sanE1MDB6NjNsbWdxOGRiY2lxZCJ9.1znv7-oQXEhwN_yuD4r9KA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-118.15, 34.03],
    zoom: 10
});

var props = {
    'n95_masks' : {},
    'PAPR_hoods': {},
    'face_shields': {},
    'ventilator_filters': {},
    'ventilator_tubing_sets': {},
    'ventilators_without_humidifiers': {},
    'ventilators_with_humidifiers': {},
    'swabs':{},
    'gloves':{},
    'gowns_and_pulse_oximeters':{}
}

map.on('load', function() {
    // Add a geojson point source.
    // Heatmap layers also work with a vector tile source.
    map.addSource('hospitals', {
        'type': 'geojson',
        'data': 'hospitals.geojson'
    });

    var hospitals = map.addLayer({
        'id': 'hospitals',
        'type': 'circle',
        'source': 'hospitals',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'circle-radius': {
                'base': 10,
                'stops': [[12, 10], [22, 50]]
            },
            'circle-color': 'white'
        }
    });

    function descriptionFromProperties(ps) {
        var div = document.createElement('div');
        var b = document.createElement('b');
        b.innerHTML = ps.name;
        div.appendChild(b);
        var ul = document.createElement('ul');
        div.appendChild(ul);

        for (let key in props) {
            var li = document.createElement('li');
            li.innerHTML = key + ": " + ps[key];
            ul.appendChild(li);
        }
        return div.outerHTML;
    }

    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });
    map.on('mousemove', 'hospitals', function(e) {
        map.getCanvas().style.cursor = 'pointer';
 
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = descriptionFromProperties(e.features[0].properties);
 
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        
        // Populate the popup and set its coordinates
        // based on the feature found.
        popup
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    map.on('mouseleave', 'hospitals', function() {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
    
    
    var layers = document.getElementById('menu');

    function addLayer(name, layer) {
        var link = document.createElement('a');
        link.href = '#';
        link.className = 'nav';
        link.innerHTML = name;
        link.id = 'nav-' + name;
        link.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if ('visible' === map.getLayoutProperty(name, 'visibility')) {
                map.setLayoutProperty(name, 'visibility', 'none');
                this.classList.remove('active');
            } else {
                map.setLayoutProperty(name, 'visibility', 'visible');
                this.classList.add('active');
            }
        }

        layers.appendChild(link);
    }

    for (let [key, value] of Object.entries(props)) {
        map.addLayer({
            'id': key,
            'type': 'heatmap',
            'source': 'hospitals',
            'maxzoom': 15,
            'layout': {
                'visibility': 'none'
            },
            'paint': {
                'heatmap-weight': {
                    'type': 'identity',
                    'property': key
                },
                'heatmap-opacity': 0.5
            }
        });
        addLayer(key, map.getLayer('hospital-' + key));
    }
});
