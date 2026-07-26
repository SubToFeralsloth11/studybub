// Modernised WebSocket layer for BrowserQuest.
//
// The original shipped a "MultiVersionWebsocketServer" built on two now-dead
// npm packages (miksago/node-websocket-server, removed from the registry, and
// Worlize/WebSocket-Node) plus a native BISON addon. Modern browsers all speak
// RFC 6455 and the game runs with `useBison = false` (plain JSON), so this file
// re-implements the same small surface the rest of the server expects on top of
// the maintained `ws` package:
//
//   server: onConnect(cb), onError(cb), onRequestStatus(cb), broadcast(msg),
//           forEachConnection(cb), addConnection(c), removeConnection(id),
//           getConnection(id)
//   connection: id, listen(cb), onClose(cb), send(msg), close(reason)
//
// Messages are JSON in both directions, mirroring the original useBison=false path.

var cls = require("./lib/class"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    WebSocketServer = require("ws").Server,
    Utils = require("./utils"),
    _ = require("underscore"),
    WS = {};

module.exports = WS;

// Static asset roots, resolved from this file (server/js/) up to the repo root.
var REPO_ROOT = path.join(__dirname, "..", ".."),
    CLIENT_DIR = path.join(REPO_ROOT, "client"),
    SHARED_DIR = path.join(REPO_ROOT, "shared");

var CONTENT_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".txt": "text/plain",
};

/**
 * Resolves a URL pathname to a static file under the client or shared dir.
 *
 * The client expects root-relative paths (e.g. /sprites/agent.json,
 * /shared/js/gametypes.js), so "/" maps to the client index and /shared/* maps
 * to the shared module directory.
 *
 * @param {string} pathname - The decoded URL pathname.
 * @returns {{path: string, type: string}|null} The file info, or null if not found / unsafe.
 */
function serveStatic(pathname) {
    var rel = pathname === "/" ? "/index.html" : pathname;
    // When served behind a reverse proxy or Ingress at /browserquest/, strip
    // that prefix so the file paths resolve inside the client directory.
    if (rel.indexOf("/browserquest/") === 0) {
        rel = rel.slice("/browserquest".length) || "/";
        if (rel === "/") rel = "/index.html";
    }
    var base, subpath;
    if (rel.indexOf("/shared/") === 0) {
        base = SHARED_DIR;
        subpath = rel.slice("/shared/".length - 1); // keep leading "/"
    } else {
        base = CLIENT_DIR;
        subpath = rel;
    }
    var filePath = path.join(base, subpath);
    // Prevent path traversal outside the served roots.
    if (filePath.indexOf(base) !== 0) return null;
    var ext = path.extname(filePath).toLowerCase();
    return {
        path: filePath,
        type: CONTENT_TYPES[ext] || "application/octet-stream",
    };
}

/** Abstract server tracking connections by id. */
var Server = cls.Class.extend({
    init: function (port) {
        this.port = port;
        this._connections = {};
    },

    onConnect: function (callback) {
        this.connection_callback = callback;
    },

    onError: function (callback) {
        this.error_callback = callback;
    },

    broadcast: function (message) {
        this.forEachConnection(function (connection) {
            connection.send(message);
        });
    },

    forEachConnection: function (callback) {
        _.each(this._connections, callback);
    },

    addConnection: function (connection) {
        this._connections[connection.id] = connection;
    },

    removeConnection: function (id) {
        delete this._connections[id];
    },

    getConnection: function (id) {
        return this._connections[id];
    },
});

/** Abstract connection wrapping a single WebSocket. */
var Connection = cls.Class.extend({
    init: function (id, connection, server) {
        this._connection = connection;
        this._server = server;
        this.id = id;
    },

    onClose: function (callback) {
        this.close_callback = callback;
    },

    listen: function (callback) {
        this.listen_callback = callback;
    },

    send: function (message) {
        this.sendUTF8(JSON.stringify(message));
    },

    sendUTF8: function (data) {
        // Drop messages to a closing socket silently; the close handler cleans up.
        if (this._connection.readyState !== 1) return;
        this._connection.send(data);
    },

    close: function (logError) {
        if (typeof log !== "undefined") {
            log.info(
                "Closing connection to " +
                    (this._connection.remoteAddress || "unknown") +
                    ". Error: " +
                    logError,
            );
        }
        try {
            this._connection.close();
        } catch (e) {
            /* already gone */
        }
    },
});

WS.Connection = Connection;

/** WebSocket server listening for RFC 6455 clients, with a /status HTTP route. */
WS.MultiVersionWebsocketServer = Server.extend({
    init: function (port) {
        var self = this;
        this._super(port);

        this._httpServer = http.createServer(function (request, response) {
            var parsed = url.parse(request.url),
                pathname = decodeURIComponent(parsed.pathname || "/");

            // Health / player-count endpoint.
            if (pathname === "/status" && self.status_callback) {
                response.writeHead(200);
                response.write(self.status_callback());
                response.end();
                return;
            }

            // Static file serving. The game client lives under /client/ and its
            // shared module under /shared/, both relative to the repo root. Map
            // bare paths to those roots so the client can be loaded at "/".
            var file = serveStatic(pathname);
            if (file === null) {
                response.writeHead(404);
                response.end();
                return;
            }
            fs.readFile(file.path, function (err, data) {
                if (err) {
                    response.writeHead(404);
                    response.end();
                    return;
                }
                response.writeHead(200, { "Content-Type": file.type });
                response.end(data);
            });
        });

        this._wss = new WebSocketServer({ server: this._httpServer });
        this._wss.on("connection", function (ws, req) {
            ws.remoteAddress = req.socket.remoteAddress;
            var c = new WS.Connection(self._createId(), ws, self);

            ws.on("message", function (data) {
                if (!c.listen_callback) return;
                try {
                    c.listen_callback(JSON.parse(data.toString()));
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        c.close("Received message was not valid JSON.");
                    } else {
                        throw e;
                    }
                }
            });

            ws.on("close", function () {
                if (c.close_callback) c.close_callback();
                self.removeConnection(c.id);
            });

            if (self.connection_callback) self.connection_callback(c);
            self.addConnection(c);
        });

        this._httpServer.listen(port, function () {
            log.info("Server is listening on port " + port);
        });
    },

    _createId: function () {
        return "5" + Utils.random(99) + "" + this._counter++;
    },

    _counter: 0,

    onRequestStatus: function (status_callback) {
        this.status_callback = status_callback;
    },
});
