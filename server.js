const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Key storage
let keys = {};
const KEYS_FILE = path.join(__dirname, 'keys.json');

// Load keys from file
function loadKeys() {
    try {
        if (fs.existsSync(KEYS_FILE)) {
            const data = fs.readFileSync(KEYS_FILE, 'utf8');
            keys = JSON.parse(data);
        } else {
            // Default test key (30 days)
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            keys = {
                "FAINT-TEST-KEY-1234": {
                    valid: true,
                    createdAt: now.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    duration: "30d",
                    uses: 0
                }
            };
            saveKeys();
        }
    } catch (err) {
        console.error('Error loading keys:', err);
    }
}

function saveKeys() {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

loadKeys();

// Key verification endpoint
app.get('/verify', (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: "No key provided" });

    if (!keys[key]) {
        return res.status(403).json({
            valid: false,
            reason: "Invalid key"
        });
    }

    const keyData = keys[key];
    
    // Check if key is valid
    if (!keyData.valid) {
        return res.status(403).json({
            valid: false,
            reason: "Key deactivated"
        });
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(keyData.expiresAt);
    if (now > expiresAt) {
        return res.status(403).json({
            valid: false,
            reason: "Key expired",
            expiresAt: keyData.expiresAt
        });
    }

    // Update uses
    keys[key].uses += 1;
    saveKeys();

    return res.json({
        valid: true,
        expiresAt: keyData.expiresAt,
        duration: keyData.duration,
        createdAt: keyData.createdAt
    });
});

// Generate new keys
app.post('/api/generate', (req, res) => {
    // Admin auth (in production use proper auth)
    if (req.headers['admin-key'] !== 'faint-admin-123') {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const { count = 1, duration = "30d" } = req.body;
    
    // Parse duration (e.g., "7d", "1m", "1y")
    const durationNum = parseInt(duration);
    const durationUnit = duration.slice(-1).toLowerCase();
    
    let durationMs;
    switch(durationUnit) {
        case 'h': durationMs = durationNum * 60 * 60 * 1000; break;
        case 'd': durationMs = durationNum * 24 * 60 * 60 * 1000; break;
        case 'w': durationMs = durationNum * 7 * 24 * 60 * 60 * 1000; break;
        case 'm': durationMs = durationNum * 30 * 24 * 60 * 60 * 1000; break;
        case 'y': durationMs = durationNum * 365 * 24 * 60 * 60 * 1000; break;
        default: return res.status(400).json({ error: "Invalid duration unit" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMs);
    const newKeys = {};

    for (let i = 0; i < count; i++) {
        const newKey = `FAINT-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        newKeys[newKey] = {
            valid: true,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            duration: duration,
            uses: 0
        };
    }

    Object.assign(keys, newKeys);
    saveKeys();

    res.json({
        success: true,
        keys: Object.keys(newKeys),
        expiresAt: expiresAt.toISOString(),
        duration: duration
    });
});

// Get all keys (admin only)
app.get('/api/keys', (req, res) => {
    if (req.headers['admin-key'] !== 'faint-admin-123') {
        return res.status(403).json({ error: "Unauthorized" });
    }
    res.json(keys);
});

app.listen(PORT, () => {
    console.log(`Faint auth server running on http://localhost:${PORT}`);
});