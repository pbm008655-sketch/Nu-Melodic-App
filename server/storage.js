"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
var memorystore_1 = __importDefault(require("memorystore"));
var express_session_1 = __importDefault(require("express-session"));
var MemoryStore = (0, memorystore_1.default)(express_session_1.default);
var MemStorage = /** @class */ (function () {
    function MemStorage() {
        this.users = new Map();
        this.albums = new Map();
        this.tracks = new Map();
        this.playlists = new Map();
        this.playlistTracks = new Map();
        this.trackPlays = new Map();
        this.userId = 1;
        this.albumId = 1;
        this.trackId = 1;
        this.playlistId = 1;
        this.playlistTrackId = 1;
        this.trackPlayId = 1;
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000,
        });
        // Seed with some initial data
        this.seedData();
    }
    MemStorage.prototype.seedData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var demoUser, album1, album2, album3, album4, album5, createTracks;
            var _this = this;
            return __generator(this, function (_a) {
                demoUser = {
                    id: this.userId++,
                    username: "demo",
                    email: "demo@example.com",
                    password: "$2b$10$dXNmcGZHaGJsZHVqaGtraUlnTnZyNDMrcy5lOU9Va2lITU56VUZRRmZlbFhsZFFpMXM5dGVCc1RKMkNhTVowamVybnRsMw==.7177bfdf1ec70da0ea9b3585649a08f2", // password is "password"
                    isPremium: false,
                    premiumExpiry: null,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                };
                this.users.set(demoUser.id, demoUser);
                album1 = {
                    id: this.albumId++,
                    title: "Midnight Memories",
                    artist: "MeloStream Artist",
                    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
                    description: "An immersive journey through late night soundscapes",
                    releaseDate: new Date("2023-05-15"),
                    customAlbum: null,
                };
                album2 = {
                    id: this.albumId++,
                    title: "Urban Echoes",
                    artist: "MeloStream Artist",
                    coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
                    description: "Electronic fusion with urban influences",
                    releaseDate: new Date("2023-08-20"),
                    customAlbum: null,
                };
                album3 = {
                    id: this.albumId++,
                    title: "Sound Waves",
                    artist: "MeloStream Artist",
                    coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
                    description: "Ambient collection for relaxation",
                    releaseDate: new Date("2023-02-10"),
                    customAlbum: null,
                };
                album4 = {
                    id: this.albumId++,
                    title: "Neon Nights",
                    artist: "MeloStream Artist",
                    coverUrl: "https://images.unsplash.com/photo-1593697972672-b1c1356e32f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
                    description: "Synthwave inspired by 80s nostalgia",
                    releaseDate: new Date("2023-09-05"),
                    customAlbum: null,
                };
                album5 = {
                    id: this.albumId++,
                    title: "Acoustic Dreams",
                    artist: "MeloStream Artist",
                    coverUrl: "https://images.unsplash.com/photo-1602848597941-0d3f3415bfa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
                    description: "Peaceful instrumental acoustic melodies",
                    releaseDate: new Date("2023-06-30"),
                    customAlbum: null,
                };
                this.albums.set(album1.id, album1);
                this.albums.set(album2.id, album2);
                this.albums.set(album3.id, album3);
                this.albums.set(album4.id, album4);
                this.albums.set(album5.id, album5);
                createTracks = function (albumId, count, featured) {
                    if (featured === void 0) { featured = false; }
                    var tracks = [];
                    for (var i = 1; i <= count; i++) {
                        var track = {
                            id: _this.trackId++,
                            title: "Track ".concat(i),
                            albumId: albumId,
                            trackNumber: i,
                            duration: 180 + Math.floor(Math.random() * 120), // 3-5 minutes
                            audioUrl: "/audio/track-".concat(albumId, "-").concat(i, ".wav"),
                            isFeatured: featured && i <= 2, // First two tracks of featured albums are featured
                        };
                        tracks.push(track);
                        _this.tracks.set(track.id, track);
                    }
                    return tracks;
                };
                createTracks(album1.id, 8, true);
                createTracks(album2.id, 6, true);
                createTracks(album3.id, 5);
                createTracks(album4.id, 7);
                createTracks(album5.id, 6, true);
                return [2 /*return*/];
            });
        });
    };
    MemStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.get(id)];
            });
        });
    };
    MemStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.username.toLowerCase() === username.toLowerCase(); })];
            });
        });
    };
    MemStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.email.toLowerCase() === email.toLowerCase(); })];
            });
        });
    };
    MemStorage.prototype.createUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var id, user;
            return __generator(this, function (_a) {
                id = this.userId++;
                user = __assign(__assign({}, insertUser), { id: id, isPremium: false, premiumExpiry: null, stripeCustomerId: null, stripeSubscriptionId: null });
                this.users.set(id, user);
                return [2 /*return*/, user];
            });
        });
    };
    MemStorage.prototype.updateUserPremiumStatus = function (userId, isPremium, expiryDate) {
        return __awaiter(this, void 0, void 0, function () {
            var user, updatedUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUser(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, undefined];
                        updatedUser = __assign(__assign({}, user), { isPremium: isPremium, premiumExpiry: expiryDate || null });
                        this.users.set(userId, updatedUser);
                        return [2 /*return*/, updatedUser];
                }
            });
        });
    };
    MemStorage.prototype.updateStripeCustomerId = function (userId, customerId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, updatedUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUser(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, undefined];
                        updatedUser = __assign(__assign({}, user), { stripeCustomerId: customerId });
                        this.users.set(userId, updatedUser);
                        return [2 /*return*/, updatedUser];
                }
            });
        });
    };
    MemStorage.prototype.updateStripeInfo = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var user, updatedUser;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getUser(userId)];
                    case 1:
                        user = _c.sent();
                        if (!user)
                            return [2 /*return*/, undefined];
                        updatedUser = __assign(__assign({}, user), { stripeCustomerId: (_a = data.stripeCustomerId) !== null && _a !== void 0 ? _a : user.stripeCustomerId, stripeSubscriptionId: (_b = data.stripeSubscriptionId) !== null && _b !== void 0 ? _b : user.stripeSubscriptionId });
                        this.users.set(userId, updatedUser);
                        return [2 /*return*/, updatedUser];
                }
            });
        });
    };
    MemStorage.prototype.getAllAlbums = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.albums.values())];
            });
        });
    };
    MemStorage.prototype.getAlbum = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.albums.get(id)];
            });
        });
    };
    MemStorage.prototype.getFeaturedAlbums = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.albums.values())
                        .sort(function () { return 0.5 - Math.random(); }) // Shuffle
                        .slice(0, limit)];
            });
        });
    };
    MemStorage.prototype.getRecentAlbums = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.albums.values())
                        .sort(function (a, b) {
                        // Sort by releaseDate in descending order (newest first)
                        if (a.releaseDate && b.releaseDate) {
                            return b.releaseDate.getTime() - a.releaseDate.getTime();
                        }
                        // If releaseDate is not available, sort by id in descending order
                        return b.id - a.id;
                    })
                        .slice(0, limit)];
            });
        });
    };
    MemStorage.prototype.createAlbum = function (album) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newAlbum;
            return __generator(this, function (_a) {
                id = this.albumId++;
                newAlbum = __assign({ id: id }, album);
                this.albums.set(id, newAlbum);
                return [2 /*return*/, newAlbum];
            });
        });
    };
    MemStorage.prototype.getAllTracks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tracks.values())];
            });
        });
    };
    MemStorage.prototype.getTrack = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tracks.get(id)];
            });
        });
    };
    MemStorage.prototype.getTracksByAlbumId = function (albumId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tracks.values())
                        .filter(function (track) { return track.albumId === albumId; })
                        .sort(function (a, b) { return a.trackNumber - b.trackNumber; })];
            });
        });
    };
    MemStorage.prototype.getFeaturedTracks = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tracks.values())
                        .filter(function (track) { return track.isFeatured; })
                        .slice(0, limit)];
            });
        });
    };
    MemStorage.prototype.createTrack = function (track) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newTrack;
            return __generator(this, function (_a) {
                id = this.trackId++;
                newTrack = __assign({ id: id }, track);
                this.tracks.set(id, newTrack);
                return [2 /*return*/, newTrack];
            });
        });
    };
    MemStorage.prototype.getUserPlaylists = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.playlists.values())
                        .filter(function (playlist) { return playlist.userId === userId; })];
            });
        });
    };
    MemStorage.prototype.getPlaylist = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.playlists.get(id)];
            });
        });
    };
    MemStorage.prototype.createPlaylist = function (playlist) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newPlaylist;
            return __generator(this, function (_a) {
                id = this.playlistId++;
                newPlaylist = {
                    id: id,
                    name: playlist.name || "New Playlist",
                    userId: playlist.userId,
                    coverUrl: playlist.coverUrl || "",
                    description: playlist.description || ""
                };
                this.playlists.set(id, newPlaylist);
                return [2 /*return*/, newPlaylist];
            });
        });
    };
    MemStorage.prototype.deletePlaylist = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // Delete the playlist tracks first
                Array.from(this.playlistTracks.values())
                    .filter(function (pt) { return pt.playlistId === id; })
                    .forEach(function (pt) { return _this.playlistTracks.delete(pt.id); });
                // Delete the playlist
                return [2 /*return*/, this.playlists.delete(id)];
            });
        });
    };
    MemStorage.prototype.getPlaylistTracks = function (playlistId) {
        return __awaiter(this, void 0, void 0, function () {
            var playlistTracksList;
            var _this = this;
            return __generator(this, function (_a) {
                playlistTracksList = Array.from(this.playlistTracks.values())
                    .filter(function (pt) { return pt.playlistId === playlistId; })
                    .sort(function (a, b) { return a.position - b.position; });
                return [2 /*return*/, Promise.all(playlistTracksList.map(function (pt) { return __awaiter(_this, void 0, void 0, function () {
                        var track;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.getTrack(pt.trackId)];
                                case 1:
                                    track = _a.sent();
                                    return [2 /*return*/, track];
                            }
                        });
                    }); }))];
            });
        });
    };
    MemStorage.prototype.addTrackToPlaylist = function (playlistId, trackId, position) {
        return __awaiter(this, void 0, void 0, function () {
            var existingTrack, id, playlistTrack;
            return __generator(this, function (_a) {
                existingTrack = Array.from(this.playlistTracks.values())
                    .find(function (pt) { return pt.playlistId === playlistId && pt.trackId === trackId; });
                if (existingTrack) {
                    return [2 /*return*/, existingTrack];
                }
                id = this.playlistTrackId++;
                playlistTrack = {
                    id: id,
                    playlistId: playlistId,
                    trackId: trackId,
                    position: position
                };
                this.playlistTracks.set(id, playlistTrack);
                return [2 /*return*/, playlistTrack];
            });
        });
    };
    MemStorage.prototype.removeTrackFromPlaylist = function (playlistId, trackId) {
        return __awaiter(this, void 0, void 0, function () {
            var playlistTrack;
            return __generator(this, function (_a) {
                playlistTrack = Array.from(this.playlistTracks.values())
                    .find(function (pt) { return pt.playlistId === playlistId && pt.trackId === trackId; });
                if (!playlistTrack) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, this.playlistTracks.delete(playlistTrack.id)];
            });
        });
    };
    // Analytics methods
    MemStorage.prototype.recordTrackPlay = function (userId, trackId) {
        return __awaiter(this, void 0, void 0, function () {
            var id, trackPlay;
            return __generator(this, function (_a) {
                id = this.trackPlayId++;
                trackPlay = {
                    id: id,
                    trackId: trackId,
                    userId: userId,
                    playedAt: new Date()
                };
                this.trackPlays.set(id, trackPlay);
                return [2 /*return*/, trackPlay];
            });
        });
    };
    MemStorage.prototype.getTrackPlays = function (trackId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.trackPlays.values())
                        .filter(function (play) { return play.trackId === trackId; })
                        .length];
            });
        });
    };
    MemStorage.prototype.getTopTracks = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var playCounts, trackCounts;
            var _this = this;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                playCounts = new Map();
                Array.from(this.trackPlays.values()).forEach(function (play) {
                    var count = playCounts.get(play.trackId) || 0;
                    playCounts.set(play.trackId, count + 1);
                });
                trackCounts = Array.from(playCounts.entries())
                    .map(function (_a) {
                    var trackId = _a[0], count = _a[1];
                    return ({
                        track: _this.tracks.get(trackId),
                        plays: count
                    });
                })
                    .sort(function (a, b) { return b.plays - a.plays; })
                    .slice(0, limit);
                return [2 /*return*/, trackCounts];
            });
        });
    };
    MemStorage.prototype.getTrackPlaysByAlbum = function (albumId) {
        return __awaiter(this, void 0, void 0, function () {
            var albumTracks, trackIds, plays;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTracksByAlbumId(albumId)];
                    case 1:
                        albumTracks = _a.sent();
                        trackIds = albumTracks.map(function (track) { return track.id; });
                        plays = Array.from(this.trackPlays.values())
                            .filter(function (play) { return trackIds.includes(play.trackId); })
                            .length;
                        return [2 /*return*/, {
                                albumId: albumId,
                                plays: plays
                            }];
                }
            });
        });
    };
    MemStorage.prototype.getPlaysByTimeRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var playsInRange, playsByDate;
            return __generator(this, function (_a) {
                playsInRange = Array.from(this.trackPlays.values())
                    .filter(function (play) { return play.playedAt >= startDate && play.playedAt <= endDate; });
                playsByDate = new Map();
                playsInRange.forEach(function (play) {
                    var dateStr = play.playedAt.toISOString().split('T')[0]; // YYYY-MM-DD
                    var count = playsByDate.get(dateStr) || 0;
                    playsByDate.set(dateStr, count + 1);
                });
                // Convert to array and sort by date
                return [2 /*return*/, Array.from(playsByDate.entries())
                        .map(function (_a) {
                        var date = _a[0], count = _a[1];
                        return ({
                            date: date,
                            plays: count
                        });
                    })
                        .sort(function (a, b) { return a.date.localeCompare(b.date); })];
            });
        });
    };
    MemStorage.prototype.getUserListeningHistory = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit) {
            var userPlays, history;
            var _this = this;
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userPlays = Array.from(this.trackPlays.values())
                            .filter(function (play) { return play.userId === userId; })
                            .sort(function (a, b) { return b.playedAt.getTime() - a.playedAt.getTime(); })
                            .slice(0, limit);
                        return [4 /*yield*/, Promise.all(userPlays.map(function (play) { return __awaiter(_this, void 0, void 0, function () {
                                var track, album;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.getTrack(play.trackId)];
                                        case 1:
                                            track = _a.sent();
                                            if (!track)
                                                throw new Error("Track not found: ".concat(play.trackId));
                                            return [4 /*yield*/, this.getAlbum(track.albumId)];
                                        case 2:
                                            album = _a.sent();
                                            if (!album)
                                                throw new Error("Album not found: ".concat(track.albumId));
                                            return [2 /*return*/, {
                                                    track: track,
                                                    album: album,
                                                    playedAt: play.playedAt
                                                }];
                                    }
                                });
                            }); }))];
                    case 1:
                        history = _a.sent();
                        return [2 /*return*/, history];
                }
            });
        });
    };
    return MemStorage;
}());
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
