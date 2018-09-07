var video = $('#video');
var style = {
    'Point': [new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                    color: 'rgba(255,255,0,0.4)'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: '#ff0',
                    width: 1
                })
            })
        })],
    'LineString': [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#f00',
                width: 3
            })
        })],
    'MultiLineString': [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#0f0',
                width: 3
            })
        })]
};

/*ベース地図*/
var blankLayer = new ol.layer.Tile({
    title: '地理院タイル(白地図)',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
        attributions: [new ol.Attribution({
            html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
        })],
        url: 'https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png'
    })
})
var paleLayer = new ol.layer.Tile({
    title: '地理院タイル(淡色)',
    type: 'base',
    visible: true,
    source: new ol.source.XYZ({
        attributions: [new ol.Attribution({
            html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
        })],
        url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
    })
})
var photoLayer = new ol.layer.Tile({
    title: '地理院タイル(写真)',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
        attributions: [new ol.Attribution({
            html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
        })],
        url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
    })
})
var hillLayer = new ol.layer.Tile({
        title: 'エコリス地図タイル(陰影)',
        type: 'base',
        visible: false,
        source: new ol.source.XYZ({
            attributions: [new ol.Attribution({
                html: "<a href='http://map.ecoris.info' target='_blank'>(株)エコリス</a>"
            })],
            url: 'https://map.ecoris.info/tiles/hill/{z}/{x}/{y}.png'
        })
    })


/*オーバーレイ*/
var MaxZoom = 23;
var MinResolution  = 40075016.68557849/256/Math.pow(2, MaxZoom);

var ozeLayer = new ol.layer.Tile({
    title: "尾瀬全域撮影2017.9<div><input id='slider_oze' type='range' value='100' oninput='changeOpacity(\"oze\")' onchange='changeOpacity(\"oze\")'/></div>",
    source: new ol.source.XYZ({
        attributions: [new ol.Attribution({
            html: "<a href='http://www.ecoris.co.jp' target='_blank'>エコリス</a>"
        })],
        url: 'https://map.ecoris.info/tiles/oze_all2017/{z}/{x}/{y}.png'
    }),
    opacity: 1,
    visible: true,
    minResolution: MinResolution
})
var blockLayer = new ol.layer.Tile({
    title: "詳細2017.9<div><input id='slider_block' type='range' value='100' oninput='changeOpacity(\"block\")' onchange='changeOpacity(\"block\")'/></div>",
    source: new ol.source.XYZ({
        attributions: [new ol.Attribution({
            html: "<a href='http://www.ecoris.co.jp' target='_blank'>エコリス</a>"
        })],
        url: 'https://map.ecoris.info/tiles/oze_block2017/{z}/{x}/{y}.png'
    }),
    opacity: 1,
    visible: true,
    minResolution: MinResolution
})
var blockLayer2 = new ol.layer.Tile({
    title: "詳細2018.7<div><input id='slider_block2' type='range' value='100' oninput='changeOpacity(\"block2\")' onchange='changeOpacity(\"block2\")'/></div>",
    source: new ol.source.XYZ({
        attributions: [new ol.Attribution({
            html: "<a href='http://www.ecoris.co.jp' target='_blank'>エコリス</a>"
        })],
        url: 'https://map.ecoris.info/tiles/oze_block2018/{z}/{x}/{y}.png'
    }),
    opacity: 1,
    visible: true,
    minResolution: MinResolution
})

/*コンテンツ*/

/*360°写真*/
var photo360Layer = new ol.layer.Vector({
  title: "360°写真",
  source: new ol.source.Vector({
    url: 'data/oze.gpx',
    format: new ol.format.GPX()
  }),
  style: function(feature, resolution) {
    return style[feature.getGeometry().getType()];
  }
});
photo360Layer.set("name","photo360")

var Drone = function(flightlog,flightvideo,name){
    this.flightlog = flightlog;
    this.flightvideo = flightvideo;

    /*ドローンマーカー*/
    this.geoMarker = new ol.Feature();
    this.markerLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
              features: [this.geoMarker]
            })
    });
    this.markerLayer.set("name","flightmarker");
    this.markerLayer.set("drone",this);

    /*ドローン飛行軌跡*/
    this.vectorSource = new ol.source.Vector();
    this.droneLayer = new ol.layer.Vector({
        source: this.vectorSource,
        style: function(feature, resolution) {
          return style[feature.getGeometry().getType()];
        }
    });
    this.droneLayer.set("name","flightlog");
    this.droneLayer.set("drone",this);

    this.pjson =[];
}

Drone.prototype.setDrone = function(data) {
    this.pjson = data;
    var point_locs = [];
    for (var i = 0, e = data.length; i < e; ++i) {
        point_locs[i] = [data[i].lon, data[i].lat];
    }
    var line_geojson = {
        type: "Feature",
        geometry: {type: "LineString", coordinates: point_locs},
    };
    var feature = (new ol.format.GeoJSON()).readFeature(line_geojson, {
      featureProjection: 'EPSG:3857'
    });
    this.vectorSource.addFeature(feature);
    setGeoMarkerPosition.now = data[0];
    setGeoMarkerPosition(data[0],this.geoMarker);
};
Drone.prototype.loaddata = function(){
  var result;
  $.ajax({
		  url: this.flightlog,
		  async: false,
		  dataType: 'json'
		}).done(function(data) {
             result=data;
        }).fail(function() {
            console.log("error");
        });
  return result;
};

var drone1 = new Drone("data/drone1.json","data/drone1.mp4");
drone1.setDrone(drone1.loaddata());

var drone2 = new Drone("data/drone2.json","data/drone2.mp4");
drone2.setDrone(drone2.loaddata());

var activedrone;
var pjson;

/*ドローンのレイヤーをグループ化（レイヤスイッチャ用）*/
var droneGroup = new ol.layer.Group({
    title: 'ドローンビデオ',
    combine: true,
    layers: [drone1.droneLayer,drone1.markerLayer,drone2.droneLayer,drone2.markerLayer]
});

/*レイヤグループ作成（レイヤスイッチャー用）*/
var contentsGroup = new ol.layer.Group({
    title: 'Contents',
    layers: []
});
var overlayGroup = new ol.layer.Group({
    title: 'Overlays',
    layers: []
});
var baseGroup = new ol.layer.Group({
    title: 'Base',
    layers: []
});

baseGroup.getLayers().push(hillLayer);
baseGroup.getLayers().push(photoLayer);
baseGroup.getLayers().push(blankLayer);
baseGroup.getLayers().push(paleLayer);

overlayGroup.getLayers().push(ozeLayer);
overlayGroup.getLayers().push(blockLayer);
overlayGroup.getLayers().push(blockLayer2);

contentsGroup.getLayers().push(photo360Layer);
contentsGroup.getLayers().push(droneGroup);



/*地図初期設定*/
var mapElement = document.getElementById('map');

var map = new ol.Map({
    layers: [baseGroup, overlayGroup, contentsGroup],
    target: mapElement,
    controls: ol.control.defaults({
       attributionOptions: ({
         collapsible: false
       })
    }),
    view: new ol.View({
       projection: "EPSG:3857",
       center: ol.proj.transform([139.227247, 36.928239], "EPSG:4326", "EPSG:3857"),
       maxZoom: 23,
       zoom: 14
    })
});
ol.hash(map);

/*レイヤスイッチャー追加*/
var layerSwitcher = new ol.control.LayerSwitcher();
map.addControl(layerSwitcher);

/*オーバーレイレイヤの乗算
ozeLayer.on("precompose", function(evt) {
    evt.context.globalCompositeOperation = 'multiply';
});
ozeLayer.on("postcompose", function(evt) {
    evt.context.globalCompositeOperation = "source-over";
});
*/

/*透過スライダー処理*/
var changeOpacity = function(layername) {
    if(layername == "oze"){
       opacity = document.getElementById("slider_oze").value;
       ozeLayer.setOpacity(opacity/100.0);
    }else if(layername == "block"){
       opacity = document.getElementById("slider_block").value;
       blockLayer.setOpacity(opacity/100.0);
    }else if(layername == "block2"){
       opacity = document.getElementById("slider_block2").value;
       blockLayer2.setOpacity(opacity/100.0);
    }
}

/*ポップアップ追加*/
var popup = new ol.Overlay.Popup();
map.addOverlay(popup);

var displayFeatureInfo = function(pixel) {
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    features.push(feature);
  });
  if (features.length > 0) {
    //var info = [];
    //var i, ii;
    //for (i = 0, ii = features.length; i < ii; ++i) {
    //  info.push(features[i].get('name'));
    //}
    //document.getElementById("tooltip").style.opacity = 1;
    //document.getElementById('tooltip').innerHTML = info.join(', ') || '(unknown)';
    map.getTarget().style.cursor = 'pointer';
  } else {
    //document.getElementById("tooltip").style.opacity = 0;
    map.getTarget().style.cursor = '';
  }
};

var displayFeaturePhoto = function(pixel,coordinate) {
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    if(layer.get("name") == "photo360"){
        features.push(feature);
    }
  });
  if (features.length > 0) {
    var fname = "";
    var ftime = "";
    fname = features[0].get('name');
    ftime = features[0].get('desc');
    html = ftime + "<br><iframe width='300' height='200' allowfullscreen style='border-style:none;' src='https://cdn.pannellum.org/2.4/pannellum.htm?panorama=https://map.ecoris.info/photodata/"+ fname + ".jpg" + "&autoLoad=true'></iframe>"
    popup.show(coordinate, html);
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
    map.forEachFeatureAtPixel(evt.pixel,
    function (feature, layer) {
        var coordinate = map.getEventCoordinate(evt.originalEvent);
        if(layer.get("drone")){
            if(activedrone != layer.get("drone")){
                activedrone = layer.get("drone");
                pjson = activedrone.pjson;
                video.html('<source src="' + activedrone.flightvideo +'" type="video/mp4">' );
                video.get(0).load();
            }
            if(video.is(':hidden')){
                video.show();
            }
            if(layer.get("name") == "flightlog"){
                coordinate = ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326");
                video.get(0).currentTime = nearest_point(coordinate[0], coordinate[1]).sec;
            }
        }else if(layer.get("name") == "photo360"){
            displayFeaturePhoto(evt.pixel,coordinate);
        }
    });
});


// listeners on the video used to place marker
video.on('seeked', function () {
	setGeoMarkerPosition(point_at_time(this.currentTime),activedrone.geoMarker);
});

video.on('timeupdate', function() {
	var it = point_at_time(this.currentTime);
	if (it !== setGeoMarkerPosition.now) {
		setGeoMarkerPosition(it,activedrone.geoMarker);
	}
});

video.on('ended', function() {
	setGeoMarkerPosition(pjson[pjson.length-1],activedrone.geoMarker);
})

video.on('click', function() {
    video.get(0).pause();
	video.hide();
})

function point_at_time(timeindex_sec) {
	var it = pjson[0];
	var min_dt = Number.POSITIVE_INFINITY;
	for (var i = 0, e = pjson.length; i < e; ++i) {
		var dt = Math.abs(pjson[i].sec - timeindex_sec);
		if (dt < min_dt) {
			it = pjson[i];
			min_dt = dt;
		}
	}
	return it;
}

function lineDistance(x1, y1, x2, y2) {
	var xs = 0, ys = 0;
	xs = x2 - x1;
	xs = xs * xs;
	ys = y2 - y1;
	ys = ys * ys;
	return Math.sqrt(xs + ys);
}

function nearest_point(lon, lat) {
	var dist = Number.POSITIVE_INFINITY;
	var it;
	for (var i = 0, e = pjson.length; i < e; ++i) {
		var ld = lineDistance(lon.toString(), lat.toString(), pjson[i].lon, pjson[i].lat);
		if (ld < dist) {
			dist = ld
			it = pjson[i];
		}
	}
	return it;
}

function setGeoMarkerPosition(data,marker){
        //setGeoMarkerPosition.now = data
        marker.setGeometry(new ol.geom.Point(ol.proj.transform([data.lon, data.lat], "EPSG:4326", "EPSG:3857")));
        var rot = data.yaw * Math.PI/180
        var iconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.65],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                rotation: rot,
                src: 'img/icon.png'
            })
        });
        marker.setStyle(iconStyle);
        setGeoMarkerPosition.now = data;
}