
// Berechnet Taupunkt, absolute Luftfeuchtigkeit, Enthalpie, Lüftungsempfehlung, 
//gemessene Temperatur & Luftfeuctigkeit inkl. Offset zwecks Kalibrierung
// -----------------------------------------------------------------------------
// von paul53 übernommen und angepasst
// http://forum.iobroker.net/viewtopic.php?f=20&t=2437&hilit=L%C3%BCftung%2A#p21476
// und Solear: http://forum.iobroker.net/viewtopic.php?f=21&t=2645&p=23381#p23282


var nn          = 39.87;                // eigene Höhe nn (normalnull), z.B. über http://de.mygeoposition.com zu ermitteln
var pfad        = "Raumklima"   +".";   // Pfad unter dem die Datenpunkte in der Javascript-Instanz angelegt werden
var controlPfad = "CONTROL"     +".";   // Pfad innerhalb des Raums
var skriptConf  = true;                 // true: Raumwerte werden über das Skript geändert / false: Raumwerte werden über Objekte (oder VIS) geändert
var defaultTemp = 21.75;                // Default TEMP_Zielwert, wenn im Raum nicht angegeben


// -----------------------------------------------------------------------------
// Räume mit Sensoren
// -----------------------------------------------------------------------------
var raeume = { // Keine Leerzeichen (Name wird als Datenpunktname verwendet!)
    // Sensoren Aussen
    "Balkon" : {
        "Sensor_TEMP"           :   "hm-rpc.0.FEQ0039183.1.TEMPERATURE" /*Balkon gr. Klima:1.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.FEQ0039183.1.HUMIDITY"    /*Balkon gr. Klima:1.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
    },
    // Sensoren Innen
    "Bad" : {
        "Sensor_TEMP"           :   "hm-rpc.0.KEQ0175977.1.TEMPERATURE" /*Bad Lana.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.KEQ0175977.1.HUMIDITY"    /*Bad Lana.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    },    
    "Arbeitszimmer" : {
        "Sensor_TEMP"           :   "hm-rpc.0.LEQ1072823.1.TEMPERATURE" /*Arbeitszimmer Thermostat.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.LEQ1072823.1.HUMIDITY"    /*Arbeitszimmer Thermostat.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    },
    "Katharina" : {
        "Sensor_TEMP"           :   "hm-rpc.0.KEQ0175649.1.TEMPERATURE" /*Katharina Klima.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.KEQ0175649.1.HUMIDITY"    /*Katharina Klima.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    },
    "Schlafzimmer" : {
        "Sensor_TEMP"           :   "hm-rpc.0.GEQ0071478.1.TEMPERATURE"/*Schlafzimmer Klima:1.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.GEQ0071478.1.HUMIDITY"/*Schlafzimmer Klima:1.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    },
    "Wohnzimmer" : {
        "Sensor_TEMP"           :   "hm-rpc.0.KEQ0850896.1.TEMPERATURE"/*Wohnzimmer Klima.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.KEQ0850896.1.HUMIDITY"/*Wohnzimmer Klima.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    },
    "Flur" : {
        "Sensor_TEMP"           :   "hm-rpc.0.KEQ0175954.1.TEMPERATURE"/*Flur:1.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.KEQ0175954.1.HUMIDITY"/*Flur:1.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    },
    "Gästebad" : {
        "Sensor_TEMP"           :   "hm-rpc.0.GEQ0071605.1.TEMPERATURE"/*Gästebad Klima:1.TEMPERATURE*/,
        "Sensor_HUM"            :   "hm-rpc.0.GEQ0071605.1.HUMIDITY"/*Gästebad Klima:1.HUMIDITY*/,
        "Sensor_TEMP_OFFSET"    :   0.0,
        "Sensor_HUM_OFFSET"     :   0,
        "TEMP_Zielwert"         :   21.75,
        "Aussensensor"          :   "Balkon"
    }
};




// =============================================================================
// Skriptbereich. Ab hier muss nichts mehr eingestellt / verändert werden.
// =============================================================================
var raumDatenpunkte = {
    "x" : {
        "DpName" : "Feuchtegehalt_Absolut",
        "init": 0,
        "dp": {
            "name": 'absoluter Feuchtegehalt',
            "desc": 'absoluter Feuchtegehalt, errechnet',
            "type": 'number',
            "role": 'value',
            "unit": 'g/kg'
        }
    },
    "rh" : {
        "DpName" : "relative_Luftfeuchtigkeit",
        "init": 0,
        "dp": {
            "name": 'gemessene relative Luftfeuchtigkeit (inkl. Offset)',
            "desc": 'relative Luftfeuchtigkeit, vom Sensor + Offset zum Ausgleich von Messungenauigkeiten des Geräts',
            "type": 'number',
            "role": 'value',
            "unit": '%'
        }
    },
    "dp" : {
        "DpName" : "Taupunkt",
        "init": 0,
        "dp": {
            "name": 'Taupunkt',
            "desc": 'Taupunkt. Temperatur von Wänden, Fenstern, usw. ab der sich die Feuchtigkeit niederschlägt.',
            "type": 'number',
            "role": 'value',
            "unit": '°C'
        }
    },
    "t" : {
        "DpName" : "Temperatur",
        "init": 0,
        "dp": {
            "name": 'gemessene Temperatur (inkl. Offset)',
            "desc": 'gemessene Temperatur vom Sensor zzgl. eines Offsets um Geräteungenauigkeiten auszugleichen',
            "type": 'number',
            "role": 'value',
            "unit": '°C'
        }
    },
    "h" : {
        "DpName" : "Enthalpie",
        "init": 0,
        "dp": {
            "name": 'Enthalpie',
            "desc": 'Enthalpie',
            "type": 'number',
            "role": 'value',
            "unit": 'kJ/kg'
        }
    },
    "lüften" : {
        "DpName" : "Lüftungsempfehlung",
        //"init": false,
        "dp": {
            "name": 'Lüftungsempfehlung',
            "desc": 'Lüftungsempfehlung',
            "type"  : 'number',
            "role": 'boolean'
        }
    }
};

var raumControl = {
    "Sensor_TEMP_OFFSET" : {
        "DpName" : "Sensor_TEMP_OFFSET",
        "init": 0,
        "dp": {
            "name": 'Offset Temperatur zum Sensormesswert (Ausgleich von Ungenauigkeiten)',
            "desc": 'Offset Temperatur zum Sensormesswert (Ausgleich von Ungenauigkeiten)',
            "type": 'number',
            "role": 'control.value',
            "unit": '°C'
        }
    },
    "Sensor_HUM_OFFSET" : {
        "DpName" : "Sensor_HUM_OFFSET",
        "init": 0,
        "dp": {
            "name": 'Offset Luftfeuchtigkeit zum Sensormesswert (Ausgleich von Ungenauigkeiten)',
            "desc": 'Offset Luftfeuchtigkeit zum Sensormesswert (Ausgleich von Ungenauigkeiten)',
            "type": 'number',
            "role": 'control.value',
            "unit": '%'
        }
    },
    "TEMP_Zielwert" : {
        "DpName" : "TEMP_Zielwert",
        "init": 0,
        "dp": {
            "name": 'Temperatursteuerwert zum lüften',
            "desc": 'Temperatursteuerwert zum lüften',
            "type": 'number',
            "role": 'control.value',
            "unit": '°C'
        }
    },
    "Aussensensor" : {
        "DpName" : "Aussensensor",
        "init": "",
        "dp": {
            "name": 'Aussensensor, der zum Vergleich genommen wird',
            "desc": 'Aussensensor, der zum Vergleich genommen wird',
            "type": 'string',
            "role": 'control.value'
        }
    }
};

var  DP = require('dewpoint');                      // Das Modul dewpoint einlesen
var xdp = new DP(nn);



function createDp() {
    var name;
    var init;
    var forceCreation;
    var common;
    for (var raum in raeume) {
        for (var datenpunktID in raumDatenpunkte) {
            name = pfad + raum + "." + raumDatenpunkte[datenpunktID].DpName;
            init = raumDatenpunkte[datenpunktID].init;
            forceCreation = false; // Init der Datenpunkte wird nur beim ersten Star angelegt. Danach bleiben die Wert auch nach Skritpstart enthalten.
            common = raumDatenpunkte[datenpunktID].dp;
            createState(name, init , forceCreation, common);
            log("neuer Datenpunkt: " + name,"debug");
        }
        for (var control in raumControl) {
            name = pfad + raum + "." + controlPfad + raumControl[control].DpName;
            //init = raumControl[control].init;
            forceCreation = skriptConf;
            common = raumControl[control].dp;
            if (typeof raeume[raum][raumControl[control].DpName] !=="undefined") {
                init = raeume[raum][raumControl[control].DpName];
                createState(name, init , forceCreation, common);
            }
        }
    }
}


function runden(wert,stellen) {
    var gerundet = Math.round(wert*10*stellen)/(10*stellen);
    return gerundet;
}


function calc(raum) {                                           // Über Modul Dewpoint absolute Feuchte berechnen
    var t           = getState(raeume[raum].Sensor_TEMP).val;   // Temperatur auslesen     
    var rh          = getState(raeume[raum].Sensor_HUM).val;    // Feuchtigkeit relativ auslesen 
    var y           = xdp.Calc(t, rh);                        
    var toffset     = 0.0;                                      // Offset in °C
    var rhoffset    = 0;                                        // Offset in %
    if(typeof raeume[raum].Sensor_TEMP_OFFSET !=="undefined") {
        var idtoffset = pfad + raum + "." + controlPfad + "Sensor_TEMP_OFFSET";
        toffset = getState(idtoffset).val;  // Offset aus den Objekten/Datenpunkt auslesen
    }
    if(typeof raeume[raum].Sensor_HUM_OFFSET !=="undefined") {
        var idrhoffset = pfad + raum + "." + controlPfad + "Sensor_HUM_OFFSET";
        rhoffset = getState(idrhoffset).val;  // Offset aus den Objekten/Datenpunkt auslesen
    }

    t       = t     + toffset;
    rh      = rh    + rhoffset;

    var x   =  y.x;                                 // Zu errechnende Variable für Feuchtegehalt in g/kg
    var dp  = y.dp;                                 // Zu errechnende Variable für Taupunkt in °C

    var h   = 1.00545 * t + (2.500827 + 0.00185894 * t) * x;


    var idx     = pfad + raum + "." + raumDatenpunkte["x"].DpName;
    var iddp    = pfad + raum + "." + raumDatenpunkte["dp"].DpName;
    var idt     = pfad + raum + "." + raumDatenpunkte["t"].DpName;
    var idrh    = pfad + raum + "." + raumDatenpunkte["rh"].DpName;
    var ih      = pfad + raum + "." + raumDatenpunkte["h"].DpName;
    
    setState(idx    , runden(x,2));     // errechnete absolute Feuchte in Variable schreiben
    setState(iddp   , runden(dp,1));    // errechneter Taupunkt in Variable schreiben
    setState(idt    , t);               // Sensor Temperatur        inkl. Offset
    setState(idrh   , rh);              // Sensor Relative Feuchte  inkl. Offset
    setState(ih     , runden(h,2));     // Enthalpie

    // Lüften
    if(typeof raeume[raum].Aussensensor !=="undefined") {
        var aussen = raeume[raum].Aussensensor;
        var idta = pfad + aussen + "." + raumDatenpunkte["t"].DpName;
        var idxa = pfad + aussen + "." + raumDatenpunkte["rh"].DpName;
    } else {
        return;
    }

    var ti = t;                     // Raumtemperatur in °C
    var xi = rh;                    // Raumfeuchtegehalt in g/kg
    var ta = getState(idta).val;    // Aussentemperatur in °C
    var xa = getState(idxa).val;    // Aussenfeuchtegehalt in g/kg
    if (xa == 0) return; 
    
    var mi = defaultTemp;           // Temperaturmittelwert auf Default

    if(typeof raeume[raum].TEMP_Zielwert !=="undefined") {
        mi = raeume[raum].TEMP_Zielwert;
    }
    var mih = mi + 0.25; // Temperaturmittelwert hoch
    var mit = mi - 0.25; // Temperaturmittelwert tief

    var idLueften = pfad + raum + "." + raumDatenpunkte["lüften"].DpName;
    
    // Lüftungsempfehlung steuern mit 0,3 g/kg und 0,5 K Hysterese
    if      (xa <= (xi - 0.4) && ta <= (ti - 0.6) && ti >= mih) setState(idLueften, true);
    else if (xa >= (xi - 0.1) || ta >= (ti - 0.1) || ti <= mit) setState(idLueften, false);

    log("Raum: " + raum+", ti:"+ti+", ta: "+ta+", xi:"+xi+", xa: "+xa+", mih:"+mih+", mit:"+mit,"debug");
}

function calcAll () {
    for (var raum in raeume) {
        calc(raum);
    }
}

/*
on({id: idSensorTemperaturBad   ,change:'ne'}, function (obj) {
    calc();
});

on({id: idSensorLuftfeuchteBad  ,change:'ne'}, function (obj) {
    calc();
});
*/

// alle zwei Minuten neu berechnen
schedule("*/2 * * * *", function () {
    calcAll();
});


function main() {
    calcAll();
    calcAll();
}

createDp();                 // Datenpunkte anlegen
setTimeout(main,    500);   // Zum Skriptstart ausführen




