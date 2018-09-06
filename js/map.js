    var hexagonheatmap;
    var hmhexaPM_aktuell;
    var hmhexaPM_1Stunde;
    var hmhexaPM_24Stunden;


    var map;
    var tiles;

    var selector1 = "P1";
    var selector2 = "aktuell";

    var P1orP2 = "";


    var options1 = {
                valueDomain: [20, 40, 60, 100, 500],
                colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
                };

//REVOIR LES GRADIENTS

    var options2 = {
                valueDomain: [0,10,11,20,21,25,26, 50,51,800],
                colorRange: ['#50f0e6','#50f0e6','#50ccaa','#50ccaa','#f0e641','#f0e641','#ff5050','#ff5050','#960032', '#960032']	
                };

    var options3 = {
                valueDomain: [0,20, 21,35, 36,50,51,100,101, 1200],
                colorRange: ['#50f0e6','#50f0e6','#50ccaa', '#50ccaa','#f0e641', '#f0e641','#ff5050', '#ff5050','#960032', '#960032']	
                };

    var options4 = {
                valueDomain: [0,50,51,100,101,150,151,200,201,300,301,500],
                colorRange: ['#00E400','#00E400','#FFFF00','#FFFF00','#FF7E00', '#FF7E00','#FF0000', '#FF0000','rgb(143, 63, 151)', 'rgb(143, 63, 151)','#7E0023','#7E0023']	
                };


    var options5 = {
                valueDomain: [10, 20, 40, 60, 100],
                colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
                };

//    var options6 = {
//                valueDomain: [0,1,1,2,2,3,3,4,4, 5],
//                colorRange: ['#50f0e6','#50f0e6','#50ccaa','#50ccaa','#f0e641','#f0e641','#ff5050','#ff5050','#960032', '#960032']	
//                };



   var div = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("display", "none");

  var div = d3.select("#sidebar").append("div")
    .attr("id", "table")
    .style("display", "none");




var tooltipDiv = document.getElementsByClassName('tooltip-div');


console.log(tooltipDiv);

window.onmousemove = function (e) {
    var x = e.clientX,
        y = e.clientY;
    
    
    
    for (var i = 0; i < tooltipDiv.length; i++) {
       tooltipDiv.item(i).style.top = (y + 1 )+ 'px';
   tooltipDiv.item(i).style.left = (x + 20) + 'px';};
    
    
    
};







    window.onload=function(){
        
          if (!navigator.geolocation){
    console.log("Geolocation is not supported by your browser");
    
  };
        

        navigator.geolocation.getCurrentPosition(success, error);  

        
    map.setView([50.495171, 9.730827], 6);
        
    hexagonheatmap = L.hexbinLayer(options1).addTo(map);
        
       d3.queue()
    .defer(d3.json, "https://api.luftdaten.info/static/v2/data.dust.min.json")
    .defer(d3.json, "https://api.luftdaten.info/static/v2/data.1h.json")
    .defer(d3.json, "https://api.luftdaten.info/static/v2/data.24h.json")
    .awaitAll(ready); 
                   
   d3.interval(function(){ 
    
    d3.selectAll('path.hexbin-hexagon').remove();

    d3.queue()
    .defer(d3.json, "https://api.luftdaten.info/static/v2/data.dust.min.json")
    .defer(d3.json, "https://api.luftdaten.info/static/v2/data.1h.json")
    .defer(d3.json, "https://api.luftdaten.info/static/v2/data.24h.json")
    .awaitAll(ready); 
            
       console.log('reload')
                     
    }, 300000);

 
        map.on('moveend', function() { 
        
        hexagonheatmap._zoomChange();
            
        });
        
        map.on('move', function() { 
//        div.style("display", "none");
            idselec1=0;
            idselec0=0;    
        });

        map.on('click', function() { 
//        div.style("display", "none");
            idselec1=0;
            idselec0=0;
        });
        
        
    };
    

 map = L.map('map',{ zoomControl:true,minZoom:1});


    tiles = L.tileLayer('https://{s}.tiles.madavi.de/{z}/{x}/{y}.png',{
				attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 18}).addTo(map);
    
    
  function ready(error,data) {
  if (error) throw error;
      
      hmhexaPM_aktuell = data[0].reduce(function(filtered, item) {
                  if (item.sensor.sensor_type.name == "SDS011") {
                 filtered.push({"data":{"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")) , "PM25":parseInt( getRightValue(item.sensordatavalues,"P2"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})}
              return filtered;
            }, []);
      
//      console.log(hmhexaPM_aktuell);
      
      
      hmhexaPM_1Stunde = data[1].reduce(function(filtered, item) {
                  if (item.sensor.sensor_type.name == "SDS011") {
                 filtered.push({"data":{"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")) , "PM25":parseInt( getRightValue(item.sensordatavalues,"P2"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})}
              return filtered;
            }, []);
      
//            console.log(hmhexaPM_1Stunde);

      
      
      hmhexaPM_24Stunden = data[2].reduce(function(filtered, item) {
                  if (item.sensor.sensor_type.name == "SDS011") {
                 filtered.push({"data":{"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")) , "PM25":parseInt( getRightValue(item.sensordatavalues,"P2"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})}
              return filtered;
            }, []);
      
//    console.log(hmhexaPM_24Stunden);

      
      if(selector2 == "aktuell" && selector1 == "P1") {makeHexagonmap(hmhexaPM_aktuell,options1);};      
      if(selector2 == "1Stunde" && selector1 == "P1"){makeHexagonmap(hmhexaPM_1Stunde,options1);};
      if(selector2 == "24Stunden" && selector1 == "P1"){makeHexagonmap(hmhexaPM_24Stunden,options1);};
      
        if(selector2 == "aktuell" && selector1 == "P2") {makeHexagonmap(hmhexaPM_aktuell,options5);};      
      if(selector2 == "1Stunde" && selector1 == "P2"){makeHexagonmap(hmhexaPM_1Stunde,options5);};
      if(selector2 == "24Stunden" && selector1 == "P2"){makeHexagonmap(hmhexaPM_24Stunden,options5);};
      
      if(selector2 == "aqia" && selector1 == "P2" ){makeHexagonmap(hmhexaPM_aktuell,options2);};
      if(selector2 == "aqia" && selector1 == "P1" ){makeHexagonmap(hmhexaPM_aktuell,options3);};
      
      if(selector2 == "aqi1s" && selector1 == "P2" ){makeHexagonmap(hmhexaPM_1Stunde,options2);};
      if(selector2 == "aqi1s" && selector1 == "P1" ){makeHexagonmap(hmhexaPM_1Stunde,options3);};
      
      if(selector2 == "aqi24s" && selector1 == "P2" ){makeHexagonmap(hmhexaPM_24Stunden,options2);};
      if(selector2 == "aqi24s" && selector1 == "P1" ){makeHexagonmap(hmhexaPM_24Stunden,options3);};

//      PM10 and PM2.5 values are based on 24-hour running means
      
//      FILTRER LES 800 + et les 1200+
      
      
      if(selector2 == "aqiusa"){makeHexagonmap(hmhexaPM_aktuell,options4);};
      if(selector2 == "aqius1s"){makeHexagonmap(hmhexaPM_1Stunde,options4);};      
      if(selector2 == "aqius24s"){makeHexagonmap(hmhexaPM_24Stunden,options4);};
      
//      if(selector2 == "officialeu"){makeHexagonmap(hmhexaPM_24Stunden,options6);};
      if(selector2 == "officialus"){makeHexagonmap(hmhexaPM_24Stunden,options4);};      
      
      
      
      
      
      
      
              
 };      
    
    
        
function makeHexagonmap(data,option){


            hexagonheatmap.initialize(option);
            hexagonheatmap.data(data);                   

};
    
    
    

        function reload(val){
            
            
                      console.log(val);

            
            
//            div.style("display", "none");
            d3.selectAll('path.hexbin-hexagon').remove();
            
            
            switch(val) {
            case "P1":
            selector1 = "P1";
            break;
            case "P2":
            selector1 = "P2";
            break;
            case "aktuell":
            selector2 = "aktuell";
            break;
            case "1h":
            selector2 = "1h";
            break;
            case "24h":
            selector2 = "24h";
            break;  
            case "aqia":
            selector2 = "aqia";
            break;  
            case "aqi1s":
            selector2 = "aqi1s";
            break;  
            case "aqi24s":
            selector2 = "aqi24s";
            break;  
            case "aqiusa":
            selector2 = "aqiusa";
            break; 
            case "aqius1s":
            selector2 = "aqius1s";
            break; 
            case "aqius24s":
            selector2 = "aqius24s";
            break; 
//            case "officialeu":
//            selector2 = "officialeu";
//            break;
            case "officialus":
            selector2 = "officialus";
            break; 
  
            };
            
                                console.log(selector1);
                                console.log(selector2);



            
    
            if(selector2 == "aktuell" && selector1 == "P1"){
                hexagonheatmap.initialize(options1);
                hexagonheatmap.data(hmhexaPM_aktuell); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='visible';
                document.getElementById('legendpm2').style.visibility='hidden';
            };
    
            
             if(selector2 == "1h" && selector1 == "P1"){
                hexagonheatmap.initialize(options1);
                hexagonheatmap.data(hmhexaPM_1Stunde); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='visible';
                document.getElementById('legendpm2').style.visibility='hidden';

            };
            
            
             if(selector2 == "24h" && selector1 == "P1"){
                hexagonheatmap.initialize(options1);
                hexagonheatmap.data(hmhexaPM_24Stunden); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='visible';
                document.getElementById('legendpm2').style.visibility='hidden';

            };
            
            
//            AJOUTER OPTIONS
            
            
              if(selector2 == "aktuell" && selector1 == "P2"){
                hexagonheatmap.initialize(options5);
                hexagonheatmap.data(hmhexaPM_aktuell); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='visible';
            };
    
            
             if(selector2 == "1h" && selector1 == "P2"){
                hexagonheatmap.initialize(options5);
                hexagonheatmap.data(hmhexaPM_1Stunde); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='visible';
            };
            
            
             if(selector2 == "24h" && selector1 == "P2"){
                hexagonheatmap.initialize(options5);
                hexagonheatmap.data(hmhexaPM_24Stunden); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='visible';
            };
            
            
            
      if(selector2 == "aqia" && selector1 == "P2" ){
                hexagonheatmap.initialize(options2);
                hexagonheatmap.data(hmhexaPM_aktuell); 
                document.getElementById('legendaqi').style.visibility='visible';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
            
      if(selector2 == "aqia" && selector1 == "P1" ){
                hexagonheatmap.initialize(options3);
                hexagonheatmap.data(hmhexaPM_aktuell);  
                document.getElementById('legendaqi').style.visibility='visible';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
      
      if(selector2 == "aqi1s" && selector1 == "P2" ){
                hexagonheatmap.initialize(options2);
                hexagonheatmap.data(hmhexaPM_1Stunde);   
                document.getElementById('legendaqi').style.visibility='visible';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
            
      if(selector2 == "aqi1s" && selector1 == "P1" ){
                hexagonheatmap.initialize(options3);
                hexagonheatmap.data(hmhexaPM_1Stunde); 
                document.getElementById('legendaqi').style.visibility='visible';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
      
      if(selector2 == "aqi24s" && selector1 == "P2" ){
                hexagonheatmap.initialize(options2);
                hexagonheatmap.data(hmhexaPM_24Stunden); 
                document.getElementById('legendaqi').style.visibility='visible';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
            
      if(selector2 == "aqi24s" && selector1 == "P1" ){
                hexagonheatmap.initialize(options3);
                hexagonheatmap.data(hmhexaPM_24Stunden); 
                document.getElementById('legendaqi').style.visibility='visible';
                document.getElementById('legendaqius').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };

            
      if(selector2 == "aqiusa"){
                hexagonheatmap.initialize(options4);
                hexagonheatmap.data(hmhexaPM_aktuell); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='visible';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
      
      if(selector2 == "aqius1s"){
                hexagonheatmap.initialize(options4);
                hexagonheatmap.data(hmhexaPM_1Stunde); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='visible';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
            
      if(selector2 == "aqius24s"){
                hexagonheatmap.initialize(options4);
                hexagonheatmap.data(hmhexaPM_24Stunden); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='visible';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
            
            
//    if(selector2 == "officialeu"){
//                hexagonheatmap.initialize(options6);
//                hexagonheatmap.data(hmhexaPM_24Stunden); 
//                document.getElementById('legendaqi').style.visibility='visible';
//                document.getElementById('legendaqius').style.visibility='hidden';
//                document.getElementById('legendpm').style.visibility='hidden';
//                document.getElementById('legendpm2').style.visibility='hidden';
//
//      };        
    

    if(selector2 == "officialus"){
                hexagonheatmap.initialize(options4);
                hexagonheatmap.data(hmhexaPM_24Stunden); 
                document.getElementById('legendaqi').style.visibility='hidden';
                document.getElementById('legendaqius').style.visibility='visible';
                document.getElementById('legendpm').style.visibility='hidden';
                document.getElementById('legendpm2').style.visibility='hidden';

      };
          
            
       
            
           
            
            
            
       if (openedGraph.length >0){
           

           
           openedGraph.forEach(function(item){
               
               removeSvg2(item);
               
               displayGraph(item);
               
           });
                   
           
       };    
             
            
    };
    
    function getRightValue(array,type){
    var value;
    array.forEach(function(item){  
       if (item.value_type == type){value = item.value;};       
    });        
    return value;
};
    
function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;
    
    
    console.log("OK POSITION");
    
    
    L.marker([latitude,longitude]).addTo(map);
    
    map.setView([latitude, longitude], 10);

    
    
};


function error() {
    output.innerHTML = "Unable to retrieve your location";
  };


function color(val){  
    
        
     var col= parseInt(val);
    
    if(val>= 0 && val < 25){ return "#00796b";};
    if(val>= 25 && val < 50){
        var couleur = interpolColor('#00796b','#f9a825',(col-25)/25);
        return couleur;
    };
    if(val>= 50 && val < 75){
        var couleur = interpolColor('#f9a825','#e65100',(col-50)/25);
        return couleur;
    };
    if(val>= 75 && val < 100){
        var couleur = interpolColor('#e65100','#dd2c00',(col-75)/25);
        return couleur;
    };
    if(val>=100 && val < 500){
        var couleur = interpolColor('#dd2c00','#8c0084',(col-100)/400);
        return couleur;
    };
    
    if(val>=100 && val < 500){ return "#8c0084";};   

 
};

function interpolColor(a, b, amount) { 
    var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
//    console.log('#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1));
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

function drop() {
    document.getElementById("control").classList.toggle("show");
    idselec1=0;
    idselec0=0;
}

function openSideBar(value){
    
   var x = document.getElementById("sidebar");
    if (x.style.display === "block") {
        x.style.display = "none";
        document.getElementById('menu').innerHTML='Open';
    } else {
        x.style.display = "block";
        document.getElementById('menu').innerHTML='Close';

    };
    
    
//    if (value == 'false'){
//    
//        document.getElementById('sidebar').style.visibility='visible';
//        document.getElementById('menu').value='true';
//        document.getElementById('menu').innerHTML='Close';
//
//        console.log(value);
//        
//        return;
//        
//    };
//    
//    if (value == 'false'){
//    
//        document.getElementById('sidebar').style.visibility='hidden';
//        document.getElementById('menu').value='false';
//        document.getElementById('menu').innerHTML='Open';
//
//        console.log(value);
//        
//        return;
//        
//    };
    
};
