"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var express_1 = __importDefault(require("express"));
var multer_1 = __importDefault(require("multer"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var url_1 = require("url");
// Get the directory name correctly in ES modules
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
// Create the upload directories if they don't exist
var audioUploadDir = path_1.default.join(process.cwd(), 'public', 'audio');
var coverUploadDir = path_1.default.join(process.cwd(), 'public', 'covers');
if (!fs_1.default.existsSync(audioUploadDir)) {
    fs_1.default.mkdirSync(audioUploadDir, { recursive: true });
}
if (!fs_1.default.existsSync(coverUploadDir)) {
    fs_1.default.mkdirSync(coverUploadDir, { recursive: true });
}
// Configure high-capacity upload middleware for album uploads
var highCapacityUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: function (req, file, cb) {
            // Send track files to audio directory and cover files to cover directory
            if (file.fieldname.startsWith('track-')) {
                cb(null, audioUploadDir);
            }
            else if (file.fieldname === 'cover') {
                cb(null, coverUploadDir);
            }
            else {
                cb(new Error("Unknown field type: ".concat(file.fieldname)), '');
            }
        },
        filename: function (req, file, cb) {
            if (file.fieldname.startsWith('track-')) {
                // Tracks will be renamed later in the request handler once we have the album ID
                var timestamp = Date.now();
                var uniqueId = Math.floor(Math.random() * 1000);
                var filename = "temp-track-".concat(timestamp, "-").concat(uniqueId).concat(path_1.default.extname(file.originalname));
                cb(null, filename);
            }
            else if (file.fieldname === 'cover') {
                // Create a unique filename for the cover image
                var timestamp = Date.now();
                var filename = "cover-".concat(timestamp).concat(path_1.default.extname(file.originalname));
                cb(null, filename);
            }
            else {
                cb(new Error("Unknown field type: ".concat(file.fieldname)), '');
            }
        }
    }),
    fileFilter: function (req, file, cb) {
        // Accept wav files from the track fields
        if (file.fieldname.startsWith('track-')) {
            if (file.mimetype !== 'audio/wav' && !file.originalname.endsWith('.wav')) {
                return cb(new Error('Only WAV files are allowed for tracks'));
            }
        }
        // Accept image files from the cover field
        else if (file.fieldname === 'cover') {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new Error('Only image files are allowed for cover'));
            }
        }
        cb(null, true);
    },
    limits: {
        fileSize: 400 * 1024 * 1024, // 400MB limit per file
        fieldSize: 400 * 1024 * 1024, // 400MB field size limit
        files: 20, // Maximum 20 files
        fields: 100, // Maximum 100 fields
        parts: 120 // Maximum 120 parts (headers + files)
    }
}).fields([
    { name: 'cover', maxCount: 1 },
    { name: 'track-0', maxCount: 1 },
    { name: 'track-1', maxCount: 1 },
    { name: 'track-2', maxCount: 1 },
    { name: 'track-3', maxCount: 1 },
    { name: 'track-4', maxCount: 1 },
    { name: 'track-5', maxCount: 1 },
    { name: 'track-6', maxCount: 1 },
    { name: 'track-7', maxCount: 1 },
    { name: 'track-8', maxCount: 1 },
    { name: 'track-9', maxCount: 1 },
    { name: 'track-10', maxCount: 1 },
    { name: 'track-11', maxCount: 1 },
    { name: 'track-12', maxCount: 1 },
    { name: 'track-13', maxCount: 1 },
    { name: 'track-14', maxCount: 1 },
    { name: 'track-15', maxCount: 1 }
]);
// Create a router to handle album uploads
var router = express_1.default.Router();
router.post('/api/high-capacity-album-upload', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            console.log("High-capacity album upload endpoint hit");
            // Execute the multer middleware
            highCapacityUpload(req, res, function (err) { return __awaiter(void 0, void 0, void 0, function () {
                var storage, _a, title, artist, files, trackFiles, coverUrl, createdAlbum, createdTracks, i, trackFile, trackNumber, newFilename, oldPath, newPath, trackTitle, trackUrl, createdTrack, innerError_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (err) {
                                console.error("Multer error:", err);
                                return [2 /*return*/, res.status(400).json({
                                        success: false,
                                        message: "Upload error: ".concat(err.message)
                                    })];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 8, , 9]);
                            console.log("Files uploaded successfully, processing...");
                            console.log("Body keys:", Object.keys(req.body || {}));
                            console.log("Files:", req.files ? Object.keys(req.files) : "No files");
                            if (!req.isAuthenticated()) {
                                return [2 /*return*/, res.status(401).json({
                                        success: false,
                                        message: "Authentication required"
                                    })];
                            }
                            return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./storage.js')); })];
                        case 2:
                            storage = (_b.sent()).storage;
                            _a = req.body, title = _a.title, artist = _a.artist;
                            if (!title || !artist) {
                                return [2 /*return*/, res.status(400).json({
                                        success: false,
                                        message: "Album title and artist are required"
                                    })];
                            }
                            files = req.files || {};
                            trackFiles = Object.entries(files)
                                .filter(function (_a) {
                                var key = _a[0];
                                return key.startsWith('track-');
                            })
                                .sort(function (a, b) {
                                var numA = parseInt(a[0].split('-')[1]);
                                var numB = parseInt(b[0].split('-')[1]);
                                return numA - numB;
                            })
                                .map(function (_a) {
                                var _ = _a[0], fileArray = _a[1];
                                return fileArray[0];
                            });
                            if (trackFiles.length === 0) {
                                return [2 /*return*/, res.status(400).json({
                                        success: false,
                                        message: "At least one track is required"
                                    })];
                            }
                            coverUrl = '';
                            if (files.cover && files.cover.length > 0) {
                                coverUrl = "/covers/".concat(files.cover[0].filename);
                            }
                            console.log("Creating album in storage...");
                            return [4 /*yield*/, storage.createAlbum({
                                    title: title,
                                    artist: artist,
                                    coverUrl: coverUrl,
                                    releaseDate: new Date(),
                                    isFeatured: false,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                })];
                        case 3:
                            createdAlbum = _b.sent();
                            console.log("Album created:", createdAlbum);
                            createdTracks = [];
                            i = 0;
                            _b.label = 4;
                        case 4:
                            if (!(i < trackFiles.length)) return [3 /*break*/, 7];
                            trackFile = trackFiles[i];
                            trackNumber = i + 1;
                            newFilename = "track-".concat(createdAlbum.id, "-").concat(trackNumber, ".wav");
                            oldPath = path_1.default.join(audioUploadDir, trackFile.filename);
                            newPath = path_1.default.join(audioUploadDir, newFilename);
                            console.log("Renaming track ".concat(i + 1, " from ").concat(trackFile.filename, " to ").concat(newFilename));
                            fs_1.default.renameSync(oldPath, newPath);
                            trackTitle = req.body["title-".concat(i)] || "Track ".concat(trackNumber);
                            trackUrl = "/audio/".concat(newFilename);
                            return [4 /*yield*/, storage.createTrack({
                                    albumId: createdAlbum.id,
                                    title: trackTitle,
                                    artist: artist,
                                    trackNumber: trackNumber,
                                    duration: 180, // We don't know actual duration without audio analysis
                                    audioUrl: trackUrl,
                                    isFeatured: false,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                })];
                        case 5:
                            createdTrack = _b.sent();
                            createdTracks.push(createdTrack);
                            _b.label = 6;
                        case 6:
                            i++;
                            return [3 /*break*/, 4];
                        case 7:
                            res.status(200).json({
                                success: true,
                                message: "Album '".concat(title, "' created with ").concat(createdTracks.length, " tracks"),
                                albumId: createdAlbum.id,
                                trackCount: createdTracks.length,
                                album: createdAlbum,
                                tracks: createdTracks
                            });
                            return [3 /*break*/, 9];
                        case 8:
                            innerError_1 = _b.sent();
                            console.error("Error in processing upload:", innerError_1);
                            res.status(500).json({
                                success: false,
                                message: "Processing failed: ".concat(innerError_1.message),
                                error: innerError_1.stack
                            });
                            return [3 /*break*/, 9];
                        case 9: return [2 /*return*/];
                    }
                });
            }); });
        }
        catch (outerError) {
            console.error("Outer error in high-capacity upload:", outerError);
            res.status(500).json({
                success: false,
                message: "Upload failed: ".concat(outerError.message),
                error: outerError.stack
            });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
