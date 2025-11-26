require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')))

// Pure function to construct NASA API URL
const createNasaUrl = (endpoint, params = {}) => {
    const baseUrl = 'https://api.nasa.gov';
    const apiKey = process.env.API_KEY;
    const queryParams = new URLSearchParams({ ...params, api_key: apiKey });
    return `${baseUrl}${endpoint}?${queryParams}`;
};

// Pure function to handle API response
const handleApiResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
};

// Get rover manifest
app.get('/rover/:name/manifest', async (req, res) => {
    try {
        const roverName = req.params.name.toLowerCase();
        const url = createNasaUrl(`/mars-photos/api/v1/manifests/${roverName}`);
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        res.json(data);
    } catch (err) {
        console.log('Error fetching manifest:', err);
        res.status(500).json({ error: 'Failed to fetch rover manifest' });
    }
});

// Get latest photos for a rover
app.get('/rover/:name/latest-photos', async (req, res) => {
    try {
        const roverName = req.params.name.toLowerCase();
        const url = createNasaUrl(`/mars-photos/api/v1/rovers/${roverName}/latest_photos`);
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        res.json(data);
    } catch (err) {
        console.log('Error fetching photos:', err);
        res.status(500).json({ error: 'Failed to fetch rover photos' });
    }
});

// Get photos by sol (optional endpoint for additional functionality)
app.get('/rover/:name/photos/:sol', async (req, res) => {
    try {
        const roverName = req.params.name.toLowerCase();
        const sol = req.params.sol;
        const url = createNasaUrl(`/mars-photos/api/v1/rovers/${roverName}/photos`, { sol });
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        res.json(data);
    } catch (err) {
        console.log('Error fetching photos by sol:', err);
        res.status(500).json({ error: 'Failed to fetch rover photos' });
    }
});

// Keep the example APOD endpoint
app.get('/apod', async (req, res) => {
    try {
        const url = createNasaUrl('/planetary/apod');
        const response = await fetch(url);
        const image = await handleApiResponse(response);
        
        res.send({ image });
    } catch (err) {
        console.log('Error fetching APOD:', err);
        res.status(500).json({ error: 'Failed to fetch APOD' });
    }
});

app.listen(port, () => console.log(`Mars Rover Dashboard listening on port ${port}!`));