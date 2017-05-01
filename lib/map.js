/**
 * Created by Saikrishna on 5/1/2017.
 */
var map;
var marker = [],
    infoWindows = [],
    ip = {};

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 20,
            lng: 0
        },
        zoom: 2
    });
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' +
            'Place ID: ' + place.place_id + '<br>' +
            place.formatted_address + '</div>');
        infowindow.open(map, this);
    });
}
var classify = function(str, str1) {
    str = str ? str : " ";
    str1 = str1 ? str1 : " ";
    if (str.indexOf("cgi") > -1 || str.indexOf("bot") > -1) {
        return "red"
    } else if (str.indexOf("Research") > -1) {
        return "purple"
    } else if (str.length > 15) {
        return "yellow"
    } else {
        return "blue"
    }
}
var compareCateg = function(a, b) {
    var arr = ["red", "purple", "yellow", "blue"]
    return arr.indexOf(a) < arr.indexOf(b) ? a : b;
}

jQuery.get('data/access.log', function(data) {
    var lines = data.split('\n');

    lines.forEach(function(ele, ind) {
        $.getJSON('https://ipapi.co/' + ele.split(" ")[0] + '/json', function(data) {
            if (data.latitude != undefined && data.longitude != undefined) {
                if (ip[data.latitude + "//" + data.longitude] == undefined) {
                    marker.push(new google.maps.Marker({
                        position: {
                            lat: data.latitude,
                            lng: data.longitude
                        },
                        map: map,
                        icon: 'http://maps.google.com/mapfiles/ms/icons/' + classify(ele.split('"')[1], ele.split('"')[5]) + '-dot.png'
                    }));
                    infoWindows.push(new google.maps.InfoWindow({
                        content: ele.split('"')[1]
                    }));
                    (function(i) {
                        google.maps.event.addListener(marker[i], 'click', function() {
                            infoWindows[i].open(map, marker[i]);
                        });
                    })(marker.length - 1);
                    ip[data.latitude + "//" + data.longitude] = {
                        "category": classify(ele.split('"')[1], ele.split('"')[5]),
                        "index": marker.length - 1
                    };
                } else {
                    marker[ip[data.latitude + "//" + data.longitude].index].setIcon('http://maps.google.com/mapfiles/ms/icons/' + compareCateg(classify(ele.split('"')[1], ele.split('"')[5]), ip[data.latitude + "//" + data.longitude].category) + '-dot.png');
                }
            }
        });
    });
});