
define(['text!../config/config_build.json'],
function(build) {
    var config = {
        // The client is served by the game server itself, so connect the
        // WebSocket back to the same host/port that served this page. This keeps
        // the embedded iframe working regardless of where StudyBub is hosted.
        dev: { host: window.location.hostname, port: Number(window.location.port) || 8000, dispatcher: false },
        build: JSON.parse(build)
    };
    
    //>>excludeStart("prodHost", pragmas.prodHost);
    require(['text!../config/config_local.json'], function(local) {
        try {
            config.local = JSON.parse(local);
        } catch(e) {
            // Exception triggered when config_local.json does not exist. Nothing to do here.
        }
    });
    //>>excludeEnd("prodHost");
    
    return config;
});