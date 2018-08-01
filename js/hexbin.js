L.HexbinLayer = L.Layer.extend({
	_undef (a) { return typeof a === 'undefined' },
	options: {
		radius: 25,
		opacity: 0.6,
		duration: 200,
		onmouseover: undefined,
		onmouseout: undefined,
        click: sensorNr,

		lng: function (d) {
			return d.longitude
		},
		lat: function (d) {
			return d.latitude
		},
		value: function (d) {
            
            if (selector1 == "P1" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){return parseInt(d3.median(d, (o) => o.o.data.PM10))}
            
            if (selector1 == "P2" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){return parseInt(d3.median(d, (o) => o.o.data.PM25))}
                        
            if (selector1 == "P1" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){return d3.median(d, (o) => aqius(o.o.data.PM10,'P1'))}
            
            if (selector1 == "P2" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){return d3.median(d, (o) => aqius(o.o.data.PM25,'P2'))}
                        
            if (selector2 == "officialus"){return d3.median(d, (o) => officialaqius(o.o.data))}
            
		}
        
        
//        ELIMINER DE LA MOYENNE OU BIEN TEST API SUR LES 3 DERNIERS JOURS
        
//        SI UN SEUL AU DESSUS => IL RESTE => QUE POUR MOYENNE
        
        
//        REVOIR LES MOYENNES POUR LE OFFICIALUS => FAIRE LA MOYENNE POUR HEXBIN APRES AVOIR DETEMINÉ LE PLUS GRAND AQI
        
        
        //d3.mean remplacé par d3.median!!!!

        
	},

	initialize (options) {
		L.setOptions(this, options)
		this._data = []
		this._colorScale = d3.scaleLinear()
			.domain(this.options.valueDomain)
			.range(this.options.colorRange)
			.clamp(true)
	},

	onAdd (map) {
		this.map = map
		let _layer = this

		// SVG element
		this._svg = L.svg()
		map.addLayer(this._svg)
		this._rootGroup = d3.select(this._svg._rootGroup).classed('d3-overlay', true)
		this.selection = this._rootGroup

		// Init shift/scale invariance helper values
		this._pixelOrigin = map.getPixelOrigin()
		this._wgsOrigin = L.latLng([0, 0])
		this._wgsInitialShift = this.map.latLngToLayerPoint(this._wgsOrigin)
		this._zoom = this.map.getZoom()
		this._shift = L.point(0, 0)
		this._scale = 1

		// Create projection object
		this.projection = {
			latLngToLayerPoint: function (latLng, zoom) {
				zoom = _layer._undef(zoom) ? _layer._zoom : zoom
				let projectedPoint = _layer.map.project(L.latLng(latLng), zoom)._round()
				return projectedPoint._subtract(_layer._pixelOrigin)
			},
			layerPointToLatLng: function (point, zoom) {
				zoom = _layer._undef(zoom) ? _layer._zoom : zoom
				let projectedPoint = L.point(point).add(_layer._pixelOrigin)
				return _layer.map.unproject(projectedPoint, zoom)
			},
			unitsPerMeter: 256 * Math.pow(2, _layer._zoom) / 40075017,
			map: _layer.map,
			layer: _layer,
			scale: 1
		}
		this.projection._projectPoint = function (x, y) {
			let point = _layer.projection.latLngToLayerPoint(new L.LatLng(y, x))
			this.stream.point(point.x, point.y)
		}

		this.projection.pathFromGeojson = d3.geoPath().projection(d3.geoTransform({point: this.projection._projectPoint}))

		// Compatibility with v.1
		this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint
		this.projection.getZoom = this.map.getZoom.bind(this.map)
		this.projection.getBounds = this.map.getBounds.bind(this.map)
		this.selection = this._rootGroup // ???

		// Initial draw
		this.draw()
	},

	onRemove (map) {
		if (this._container != null)
			this._container.remove()

		// Remove events
		map.off({'moveend': this._redraw}, this)

		this._container = null
		this._map = null

		// Explicitly will leave the data array alone in case the layer will be shown again
		// this._data = [];
	},

	addTo (map) {
		map.addLayer(this)
		return this
	},

	_disableLeafletRounding () {
		this._leaflet_round = L.Point.prototype._round
		L.Point.prototype._round = function () { return this }
	},

	_enableLeafletRounding () {
		L.Point.prototype._round = this._leaflet_round
	},

	draw () {
		this._disableLeafletRounding()
		this._redraw(this.selection, this.projection, this.map.getZoom())
		this._enableLeafletRounding()
	},
	getEvents: function () { return {zoomend: this._zoomChange} },
    
    
	_zoomChange: function () {
        
		let mapZoom = map.getZoom()
        let MapCenter = map.getCenter()
		this._disableLeafletRounding()
		let newZoom = this._undef(mapZoom) ? this.map._zoom : mapZoom        
		this._zoomDiff = newZoom - this._zoom
		this._scale = Math.pow(2, this._zoomDiff)
		this.projection.scale = this._scale
		this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
				._subtract(this._wgsInitialShift.multiplyBy(this._scale))
		let shift = ["translate(", this._shift.x, ",", this._shift.y, ") "]    
		let scale = ["scale(", this._scale, ",", this._scale,") "]
		this._rootGroup.attr("transform", shift.concat(scale).join(""))
		this.draw()
		this._enableLeafletRounding()
	},
	_redraw(selection, projection, zoom){
		// Generate the mapped version of the data
		let data = this._data.map( (d) => {
			let lng = this.options.lng(d)
			let lat = this.options.lat(d)

			let point = projection.latLngToLayerPoint([lat, lng])
			return { o: d, point: point }
		});
        
		// Select the hex group for the current zoom level. This has
		// the effect of recreating the group if the zoom level has changed
		let join = selection.selectAll('g.hexbin')
			.data([zoom], (d) => d)

        
		// enter
		join.enter().append('g')
			.attr('class', (d) => 'hexbin zoom-' + d)

		// exit
		join.exit().remove()
        

		// add the hexagons to the select
		this._createHexagons(join, data, projection)
        
	},

	_createHexagons(g, data, projection) {
		// Create the bins using the hexbin layout
        
		let hexbin = d3.hexbin()
			.radius(this.options.radius / projection.scale)
			.x( (d) => d.point.x )
			.y( (d) => d.point.y )
		let bins = hexbin(data)
        
//        console.log(bins)        
        
		// Join - Join the Hexagons to the data
		let join = g.selectAll('path.hexbin-hexagon')
			.data(bins)


		// Update - set the fill and opacity on a transition (opacity is re-applied in case the enter transition was cancelled)
		join.transition().duration(this.options.duration)
			.attr('fill', (d) => this._colorScale(this.options.value(d)))
			.attr('fill-opacity', this.options.opacity)
			.attr('stroke-opacity', this.options.opacity)

		// Enter - establish the path, the fill, and the initial opacity
		join.enter().append('path').attr('class', 'hexbin-hexagon')
			.attr('d', (d) => 'M' + d.x + ',' + d.y + hexbin.hexagon())
			.attr('fill', (d) => this._colorScale(this.options.value(d)))
			.attr('fill-opacity', 0.01)
			.attr('stroke-opacity', 0.01)
			.on('mouseover', this.options.mouseover)
			.on('mouseout', this.options.mouseout)
			.on('click', this.options.click)
			.transition().duration(this.options.duration)
				.attr('fill-opacity', this.options.opacity)
				.attr('stroke-opacity', this.options.opacity)

		// Exit
		join.exit().transition().duration(this.options.duration)
			.attr('fill-opacity', 0.01)
			.attr('stroke-opacity', 0.01)
			.remove()
	},
	data (data) {
		this._data = (data != null) ? data : []
		this.draw()
		return this
	}
});

L.hexbinLayer = function(options) {
	return new L.HexbinLayer(options);
};




var idselec1=0;
var idselec0=0;

var openedGraph = [];


function sensorNr(data){
    
     openedGraph = [];
    
    
    var x = document.getElementById("sidebar");
    if (x.style.display = "none") {
        x.style.display = "block";
        document.getElementById('menu').innerHTML='Close';
    };

    
        
    if (data.length == 1){
        
        
        if (selector1 == "P1" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){
            var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM10 &micro;g/m&sup3;</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>#"+data[0].o.id+"</td><td id='P1sens'>"+parseInt(data[0].o.data.PM10)+"</td></tr><tr id='graph_"+data[0].o.id+"' colspan='2' ></tr></table>";
        };
        
        if (selector1 == "P2" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){
            var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>#"+data[0].o.id+"</td><td id='P2sens'>"+parseInt(data[0].o.data.PM25)+"</td></tr><tr id='graph_"+data[0].o.id+"' colspan='2' ></tr></table>";   
        };
        
        if (selector1 == "P1" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){
        
            var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM10 AQI US</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>#"+data[0].o.id+"</td><td id='P1sens'>"+parseInt(aqius(data[0].o.data.PM10,'P1'))+"</td></tr><tr id='graph_"+data[0].o.id+"' colspan='2' ></tr></table>";  
        
        };
        
        
        
        if (selector1 == "P2" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){
                
              var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM2.5 AQI US</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>#"+data[0].o.id+"</td><td id='P2sens'>"+parseInt(aqius(data[0].o.data.PM25,'P2'))+"</td></tr><tr id='graph_"+data[0].o.id+"' colspan='2' ></tr></table>";    
                     
        };
        
        
        if (P1orP2 == "P1" && selector2 == "officialus"){
                
              var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM10 AQI US</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>#"+data[0].o.id+"</td><td id='P1sens'>"+parseInt(aqius(data[0].o.data.PM10,'P1'))+"</td></tr><tr id='graph_"+data[0].o.id+"' colspan='2' ></tr></table>";    
                     
        };
        
        if (P1orP2 == "P2" && selector2 == "officialus" ){
                
              var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM2.5 AQI US</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>#"+data[0].o.id+"</td><td id='P2sens'>"+parseInt(aqius(data[0].o.data.PM25,'P2'))+"</td></tr><tr id='graph_"+data[0].o.id+"' colspan='2' ></tr></table>";    
                     
        };
        
    
    };
    
    
    
    
    
    
    
    
    if (data.length > 1){
        

        
        if (selector1 == "P1" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){
            var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM10 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P1sens'>"+parseInt(d3.median(data, (o) => o.o.data.PM10))+"</td></tr>";
            
            var sensors = '';
            
            data.forEach(function(i) {
                    sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>#"+i.o.id+"</td><td id='P1sens'>"+i.o.data.PM10+"</td></tr><tr id='graph_"+i.o.id+"' colspan='2' ></tr>";
                    });
            
            
                        var textefin = texte + sensors + "</table>";


            
        };
        
        if (selector1 == "P2" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){
            var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P2sens'>"+parseInt(d3.median(data, (o) => o.o.data.PM25))+"</td></tr>";  
            
            
            var sensors = '';
            
            data.forEach(function(i) {
                  sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>#"+i.o.id+"</td><td id='P1sens'>"+i.o.data.PM25+"</td></tr><tr id='graph_"+i.o.id+"' colspan='2' ></tr>";
                    });
            
            
            
                        var textefin = texte + sensors + "</table>";
            
        };
        
        if (selector1 == "P1" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){
        
            var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM10 AQI US</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P1sens'>"+parseInt(d3.median(data, (o) => aqius(o.o.data.PM10,'P1')))+"</td></tr>";  
            
            
            var sensors = '';
            
            data.forEach(function(i) {
                    sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>#"+i.o.id+"</td><td id='P1sens'>"+parseInt(aqius(i.o.data.PM10,'P1'))+"</td></tr><tr id='graph_"+i.o.id+"' colspan='2' ></tr>";
                    });
            
                        var textefin = texte + sensors + "</table>";

        
        };
        
        
        
        console.log(selector1 +'  '+selector2);
        
        
        if (selector1 == "P2" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){
                
                        
              var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM2.5 AQI US</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P2sens'>"+parseInt(d3.median(data, (o) => aqius(o.o.data.PM25,'P2')))+"</td></tr>"; 
            
            
            var sensors = '';
            
            data.forEach(function(i) {
            
             sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>#"+i.o.id+"</td><td id='P1sens'>"+parseInt(aqius(i.o.data.PM25,'P2'))+"</td></tr><tr id='graph_"+i.o.id+"' colspan='2' ></tr>";
                    });
            
            var textefin = texte + sensors + "</table>";            
                     
        };
              
 
    
    
        
        if (P1orP2 == "P1" && selector2 == "officialus"){
            
             var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM2.5 AQI US</th></tr><tr><td class='idsens'>Median PM10 "+data.length+" Sens.</td><td id='P1sens'>"+parseInt(d3.median(data, (o) => aqius(o.o.data.PM10,'P1')))+"</td></tr>"; 
            
             var sensors = '';
            
            data.forEach(function(i) {
            
             sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>#"+i.o.id+"</td><td id='P1sens'>"+parseInt(aqius(i.o.data.PM10,'P1'))+"</td></tr><tr id='graph_"+i.o.id+"' colspan='2' ></tr>";
                    });
                
            
            
                        var textefin = texte + sensors + "</table>";            

            

              
        };
        
        if (P1orP2 == "P2" && selector2 == "officialus" ){
            
            var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM2.5 AQI US</th></tr><tr><td class='idsens'>Median PM2.5 "+data.length+" Sens.</td><td id='P2sens'>"+parseInt(d3.median(data, (o) => aqius(o.o.data.PM25,'P2')))+"</td></tr>"; 
            
             var sensors = '';
            
            
            data.forEach(function(i) {
            
             sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>#"+i.o.id+"</td><td id='P2sens'>"+parseInt(aqius(i.o.data.PM25,'P2'))+"</td></tr><tr id='graph_"+i.o.id+"' colspan='2' ></tr>";
                    });
            

                        var textefin = texte + sensors + "</table>";            

                
        };
    };
    
    
    
    
    
    
    

       div.transition()		
                .duration(200)		
                .style("display", "inline");
    
//            div	.html(textefin)	
//                .style("left", (d3.event.pageX-45) + "px")		
//                .style("top", (d3.event.pageY-10) + "px");
    
    
            div	.html(textefin)	
                .style("left","0px")		
                .style("top","100px");
                
    
};

function aqius(val,type){
    
    var index;
    
    if (type == 'P1'){
    if(parseInt(val) >= 0 && parseInt(val)<= 54){index = formula(50,0,54,0,parseInt(val))};
    if(parseInt(val) >= 55 && parseInt(val)<= 154){index = formula(100,51,154,55,parseInt(val))};
    if(parseInt(val) >= 155 && parseInt(val)<= 254){index = formula(150,101,254,155,parseInt(val))};
    if(parseInt(val) >= 255 && parseInt(val)<= 354){index = formula(200,151,354,255,parseInt(val)) };
    if(parseInt(val) >= 355 && parseInt(val)<= 424){index = formula(300,201,424,355,parseInt(val))};
    if(parseInt(val) >= 425 && parseInt(val)<= 504){index = formula(400,301,504,425,parseInt(val))};
    if(parseInt(val) >= 505 && parseInt(val)<= 604){index = formula(500,401,604,505,parseInt(val))}; 
        
    if(parseInt(val) > 604){index = 500};
    };
    
    if (type == 'P2'){
    if(val.toFixed(1) >= 0 && val.toFixed(1)<= 12){index = formula(50,0,12,0,val.toFixed(1))};
    if(val.toFixed(1) >= 12.1 && val.toFixed(1)<= 35.4){index = formula(100,51,35.4,12.1,val.toFixed(1))};
    if(val.toFixed(1) >= 35.5 && val.toFixed(1)<= 55.4){index = formula(150,101,55.4,35.5,val.toFixed(1))};
    if(val.toFixed(1) >= 55.5 && val.toFixed(1)<= 150.4){index = formula(200,151,150.4,55.5,val.toFixed(1))};
    if(val.toFixed(1) >= 150.5 && val.toFixed(1)<= 250.4){index = formula(300,201,250.4,150.5,val.toFixed(1))};
    if(val.toFixed(1) >= 250.5 && val.toFixed(1)<= 350.4){index = formula(400,301,350.4,250.5,val.toFixed(1))};
    if(val.toFixed(1) >= 350.5 && val.toFixed(1)<= 550.4){index = formula(500,401,550.4,350.5,val.toFixed(1))};
        
    if(val.toFixed(1) > 550.4){index = 500};
    };
    
   return index;     
};


function formula(Ih,Il,Ch,Cl,C){
    
    var result = (((Ih-Il)/(Ch-Cl))*(C-Cl))+Il;
    
 return parseInt(result);   
    
};


function displayGraph(sens) {
    
    
    idselec1 = sens;
    
    if (idselec1 != idselec0){
        
//        console.log('idselec OK');
        
        idselec0 = sens;
        
        
        if (!openedGraph.includes(sens)){
        
        openedGraph.push(sens);
            
            };
        
        console.log(openedGraph);  
        
     var url = '';   
    
    var dataGraph = [];
    
        
      if (selector2 == "aktuell" || selector2 == "aqia" || selector2 == "aqiusa"){
          
        url = "https://feinstaub.rexfue.de/api/getdata?sensorid="+sens+"&avg=5&span=24";
                    
          };
    
          
          
    if (selector2 == "1h" || selector2 == "aqi1s" || selector2 == "aqius1s" ){
          
          
        url =  "https://feinstaub.rexfue.de/api/getdata?sensorid="+sens+"&avg=60&span=48"; 
          
      };
        
    
     if (selector2 == "24h" || selector2 == "aqi24s" || selector2 == "aqius24s" ){
          
          
         url = "https://feinstaub.rexfue.de/api/getdata?sensorid="+sens+"&avg=1440&span=120"; 
          
      };
        
        
        
         if (selector2 == "officialus" ){
          
//          Valeur floating 24h pour official us
             
             
         url = "https://feinstaub.rexfue.de/api/getdata?sensorid="+sens+"&avg=1440&span=120"; 
          
      };
        
        
    
//    d3.text(url, function(error, raw){
//	var dsv = d3.dsvFormat(';')
//	var data = dsv.parse(raw)
//    
//    
    
    d3.json(url,function(data){
    
    
    console.log(url);

//    console.log(data);
        
        dataGraph = data.values;
        
 
        
        var parseTime = d3.isoParse;  
    
    var iddiv = "#graph_"+sens;
        
        var test = d3.select(iddiv).select("#linechart_"+sens).empty();
        
        console.log(test);
        
        console.log(sens);
        
    
        if (test ==true){
            
            console.log(sens+" OK");
            
            
    var bouton = d3.select(iddiv).append("button")
                .style("visibility","hidden")
                .attr("onclick","window.open('http://feinstaub.rexfue.de/"+sens+"','_blank')")
                .attr("id","button_"+sens)
                .html("Open graph in a new tab");
            
    
    var svg = d3.select(iddiv).append("svg")
            .style("visibility","hidden")
        .attr("id","linechart_"+sens)
            .attr("onclick","removeSvg("+sens+")");
            
            
    
    var linechart  = document.getElementById("linechart_"+sens); 
    var rect = linechart.getBoundingClientRect(); 
//    
    var widthGraph = parseInt(rect.width);
    var heightGraph = parseInt(rect.height);

     console.log(widthGraph);
    console.log(heightGraph);
    
    var margin = {top: 20, right: 10, bottom: 30, left: 30},
    width = widthGraph - margin.left - margin.right,
    height = heightGraph - margin.top - margin.bottom;
    
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);    
    
    dataGraph.sort(function(a, b){return parseTime(a.dt)-parseTime(b.dt)});
            
    dataGraph.forEach(function(d) {
      d.dt = parseTime(d.dt);
        


        
          if (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s"){
        
        d.P1 = +d.P1;
        d.P2 = +d.P2;
        
          };
        
        
        if (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s"){
            
            var aqiP1 = aqius(parseFloat(d.P1),'P1');
            var aqiP2 = aqius(parseFloat(d.P2),'P2')
            
            
            
        
        d.P1 = +aqiP1;
        d.P2 = +aqiP2;
            
//            if (selector2 == "aqius24s"){console.log(d.dt + "      "+d.P1 + "    "+d.P2)};
            
            
        
          };
        
        
         if (selector2 == "officialus"){
            
            var aqiP1 = aqius(parseFloat(d.P1),'P1');
            var aqiP2 = aqius(parseFloat(d.P2),'P2')
        
        d.P1 = +aqiP1;
        d.P2 = +aqiP2;
        
          };
        
        
        
        
  });
    
    
    
    
    var valueline1 = d3.line()
    .curve(d3.curveNatural)
    .x(function(d) {return x(d.dt)})
    .y(function(d) {return y(d.P1)});
    
        
// .curve(d3.curveLinear)
            
// .curve(d3.curveBasis)

        
        
     var valueline2 = d3.line()
    .curve(d3.curveNatural)
    .x(function(d) {return x(d.dt)})
    .y(function(d) {return y(d.P2)});
//    
    x.domain(d3.extent(dataGraph, (d) => d.dt));
        
        
if (selector1 == "P1" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" )){y.domain([0,d3.max(dataGraph, (i) => i.P1)])};
    
if (selector1 == "P2" && (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" )){y.domain([0,d3.max(dataGraph, (i) => i.P2)])};
            
if (selector1 == "P1" && ( selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){y.domain([0,d3.max(dataGraph, (i) => i.P1)])};
    
if (selector1 == "P2" && (selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){y.domain([0,d3.max(dataGraph, (i) => i.P2)])};
                
if (selector1 == "P1" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){y.domain([0,d3.max(dataGraph, (i) => i.P1)])};
              
if ( selector1 == "P2" && (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s")){y.domain([0,d3.max(dataGraph, (i) => i.P2)])};
//    console.log(d3.extent(dataGraph, (d) => d.timestamp));
//    console.log([0,d3.max(dataGraph, (i) => i.P1)]);
//    
            
            
if ( P1orP2 == "P1" && selector2 == "officialus"){y.domain([0,d3.max(dataGraph, (i) => i.P1)])};

if ( P1orP2 == "P2" && selector2 == "officialus"){y.domain([0,d3.max(dataGraph, (i) => i.P2)])};
            
            
            if (selector1 == "P1" && ( selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" )){
                
                if (d3.max(dataGraph, (i) => i.P1) >= 50){
                
                svg.append("line")
                .style("stroke", "red")
                .attr("x1", 0)  
                .attr("y1", y(50))  
                .attr("x2", width)  
                .attr("y2", y(50)) 
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
                
                
                };    
                
            };
            
            
            
            
            
            
            
            
            
            if (selector1 == "P2" && ( selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" )){
                
            if (d3.max(dataGraph, (i) => i.P2) >= 25){

                 svg.append("line")
                .style("stroke", "red")
                .attr("x1", 0)  
                .attr("y1", y(25))  
                .attr("x2", width)  
                .attr("y2", y(25)) 
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
                
                
            };
            };
            
       
    
    if (selector1 == "P1" && ( selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){
       
        
       var limits =[0,20,35,50,100,1200]; 
        var colors =["#50f0e6","#50f0e6","#50ccaa","#f0e641","#ff5050","#960032"];
        
        
        for (var i = 1; i < limits.length; i++) {

        if (d3.max(dataGraph, (i) => i.P1) >= limits[i]){
            
            svg.append("rect")
                .attr("x", 0)
                .attr("y", y(limits[i]))
                .attr("width", width)
                .attr("height", height-y(limits[i]-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            }else{
            
                svg.append("rect")
                .attr("x", 0)
                .attr("y", y(d3.max(dataGraph, (i) => i.P1)))
                .attr("width", width)
                .attr("height", height-y(d3.max(dataGraph, (i) => i.P1)-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            break;
            
            };
        };
      
        
    };
        
        
        
        
       if (selector1 == "P2" && ( selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s")){
       
           
           var limits =[0,10,20,25,500,800]; 
        var colors =["#50f0e6","#50f0e6","#50ccaa","#f0e641","#ff5050","#960032"];
        
        
        for (var i = 1; i < limits.length; i++) {

        if (d3.max(dataGraph, (i) => i.P2) >= limits[i]){
            
            svg.append("rect")
                .attr("x", 0)
                .attr("y", y(limits[i]))
                .attr("width", width)
                .attr("height", height-y(limits[i]-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            }else{
            
                svg.append("rect")
                .attr("x", 0)
                .attr("y", y(d3.max(dataGraph, (i) => i.P2)))
                .attr("width", width)
                .attr("height", height-y(d3.max(dataGraph, (i) => i.P2)-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            break;
            
            };
        };
         
    };
        
 
    
    if (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s"){
        
        var limits =[0,50,100,150,200,300,500]; 
        var colors =["#00E400","#00E400","#FFFF00","#FF7E00","#FF0000","rgb(143, 63, 151)","#7E0023"];
        
        
        if(selector1 == "P1"){
        
       for (var i = 1; i < limits.length; i++) {

        if (d3.max(dataGraph, (i) => i.P1) >= limits[i]){
            
            svg.append("rect")
                .attr("x", 0)
                .attr("y", y(limits[i]))
                .attr("width", width)
                .attr("height", height-y(limits[i]-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            }else{
            
                svg.append("rect")
                .attr("x", 0)
                .attr("y", y(d3.max(dataGraph, (i) => i.P1)))
                .attr("width", width)
                .attr("height", height-y(d3.max(dataGraph, (i) => i.P1)-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            break;
            
            };
        };
        
        };
        
        
        if(selector1 == "P2"){
        
       for (var i = 1; i < limits.length; i++) {

        if (d3.max(dataGraph, (i) => i.P2) >= limits[i]){
            
            svg.append("rect")
                .attr("x", 0)
                .attr("y", y(limits[i]))
                .attr("width", width)
                .attr("height", height-y(limits[i]-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            }else{
            
                svg.append("rect")
                .attr("x", 0)
                .attr("y", y(d3.max(dataGraph, (i) => i.P2)))
                .attr("width", width)
                .attr("height", height-y(d3.max(dataGraph, (i) => i.P2)-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            break;
            
            };
        };
        
        };
        
    };
        
        
            
            
            
            
            
            if (selector2 == "officialus"){
        
        var limits =[0,50,100,150,200,300,500]; 
        var colors =["#00E400","#00E400","#FFFF00","#FF7E00","#FF0000","rgb(143, 63, 151)","#7E0023"];
        
        
        if(P1orP2 == "P1"){
        
       for (var i = 1; i < limits.length; i++) {

        if (d3.max(dataGraph, (i) => i.P1) >= limits[i]){
            
            svg.append("rect")
                .attr("x", 0)
                .attr("y", y(limits[i]))
                .attr("width", width)
                .attr("height", height-y(limits[i]-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            }else{
            
                svg.append("rect")
                .attr("x", 0)
                .attr("y", y(d3.max(dataGraph, (i) => i.P1)))
                .attr("width", width)
                .attr("height", height-y(d3.max(dataGraph, (i) => i.P1)-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            break;
            
            };
        };
        
        };
        
        
        if(P1orP2 == "P2"){
        
       for (var i = 1; i < limits.length; i++) {

        if (d3.max(dataGraph, (i) => i.P2) >= limits[i]){
            
            svg.append("rect")
                .attr("x", 0)
                .attr("y", y(limits[i]))
                .attr("width", width)
                .attr("height", height-y(limits[i]-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            }else{
            
                svg.append("rect")
                .attr("x", 0)
                .attr("y", y(d3.max(dataGraph, (i) => i.P2)))
                .attr("width", width)
                .attr("height", height-y(d3.max(dataGraph, (i) => i.P2)-limits[i-1]))
                .attr("fill", colors[i])
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("opacity", 1.0);
            
            break;
            
            };
        };
        
        };
        
    };
        
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
    if(selector1 == "P1" && selector2 != "officialus" ){
               
       svg.append("path")
      .data([dataGraph])
      .attr("class", "line1")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("d", valueline1);
       
       };
       
    if(selector1 == "P2" && selector2 != "officialus"){
        
         svg.append("path")
      .data([dataGraph])
      .attr("class", "line2")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("d", valueline2);
        
        
    };
            
    
    if(P1orP2 == "P1" && selector2 == "officialus" ){
               
       svg.append("path")
      .data([dataGraph])
      .attr("class", "line1")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("d", valueline1);
       
       };
       
    if(P1orP2 == "P2" && selector2 == "officialus"){
        
         svg.append("path")
      .data([dataGraph])
      .attr("class", "line2")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("d", valueline2);
        
        
    };
            
            
            
            
            
            
            
            
            
     

     svg.append("g")  
    .attr("transform", "translate(" + margin.left + "," + (heightGraph - 30) + ")")
    .attr("class", "axis axis--x")
    .call(d3.axisBottom(x).ticks(6));
//
  svg.append("g")
  .attr("class", "axis axis--y")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text(function(){
            if (selector2 == "aktuell" || selector2 == "1h" || selector2 == "24h" || selector2 == "aqia" || selector2 == "aqi1s" || selector2 == "aqi24s"){return "PM μg/m³"};
            if (selector2 == "aqiusa" || selector2 == "aqius1s" || selector2 == "aqius24s"){return "AQI US"};
            });     
            
            bouton.style("visibility", "visible");
            svg.style("visibility", "visible");
        

    };
    });
    };
            
};
  

function removeSvg(id){
idselec1=0;
 idselec0=0;
    d3.select("#linechart_"+id).remove();
    d3.select("#button_"+id).remove();
//    svg.style("visibility", "hidden");
    
    removeInArray(openedGraph,id);
};


function removeSvg2(id){
idselec1=0;
 idselec0=0;
    d3.select("#linechart_"+id).remove();
    d3.select("#button_"+id).remove();
//    svg.style("visibility", "hidden");
    
    console.log(openedGraph);
    };



function officialaqius(data){
                   
        var P1 = aqius(data.PM10,'P1');
        var P2 = aqius(data.PM25,'P2');
        
        if (P1>=P2){P1orP2 ='P1';return P1};
        if (P1<P2){P1orP2 ='P2';return P2};        
};



function removeInArray(array) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && array.length) {
        what = a[--L];
        while ((ax= array.indexOf(what)) !== -1) {
            array.splice(ax, 1);
        }
    }
    
    console.log(array);
    
    return array;
}


//function officialaqieu(data){
//    
//    var P1 = d3.median(data, (o) => o.o.data.PM10);
//    var P2 = d3.median(data, (o) => o.o.data.PM25);
//    
//    if (P1>=P2){return parseInt(P1)};
//    if (P1<P2){return parseInt(P2)}; 
//    
//};
//
//
//
//
//function compare(val,option){
//
//        if(option == 'P1'){
//
//    
//        if (parseInt(val)<=20){return 0.5};
//        if (20<parseInt(val)<=35){return 1.5};
//        if (35<parseInt(val)<=50){return 2.5};
//        if (50<parseInt(val)<=100){return 3.5};
//        if (100<parseInt(val)<=1200){return 4.5};
//        };
//             
//    if(option == 'P2'){
//    
//        if (parseInt(val)<=10){return 0.5};
//        if (10<parseInt(val)<=20){return 1.5};
//        if (20<parseInt(val)<=25){return 2.5};
//        if (25<parseInt(val)<=50){return 3.5};
//        if (50<parseInt(val)<=800){return 4.5};
//        
//    };
//};