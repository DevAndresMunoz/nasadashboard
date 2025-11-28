require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));

// NASA Image and Video Library API base URL
const NASA_IMAGE_API = 'https://images-api.nasa.gov';

// Pure function to create search URL
const createSearchUrl = (query, mediaType = 'image') => {
    return `${NASA_IMAGE_API}/search?q=${encodeURIComponent(query)}&media_type=${mediaType}`;
};

// Pure function to handle API response
const handleApiResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
    }
    return await response.json();
};

// Search for rover images
app.get('/rover/:name/images', async (req, res) => {
    try {
        const roverName = req.params.name;
        const searchQuery = `${roverName} rover mars`;
        const url = createSearchUrl(searchQuery);
        
        console.log('Fetching images from:', url);
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        res.json(data);
        
    } catch (err) {
        console.log('Error fetching images:', err.message);
        res.status(500).json({ error: 'Failed to fetch rover images', details: err.message });
    }
});

// Get asset details (high-res images)
app.get('/asset/:nasa_id', async (req, res) => {
    try {
        const nasaId = req.params.nasa_id;
        const url = `${NASA_IMAGE_API}/asset/${nasaId}`;
        
        console.log('Fetching asset from:', url);
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        res.json(data);
        
    } catch (err) {
        console.log('Error fetching asset:', err.message);
        res.status(500).json({ error: 'Failed to fetch asset', details: err.message });
    }
});

// Get metadata for an asset
app.get('/metadata/:nasa_id', async (req, res) => {
    try {
        const nasaId = req.params.nasa_id;
        const url = `${NASA_IMAGE_API}/metadata/${nasaId}`;
        
        console.log('Fetching metadata from:', url);
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        res.json(data);
        
    } catch (err) {
        console.log('Error fetching metadata:', err.message);
        res.status(500).json({ error: 'Failed to fetch metadata', details: err.message });
    }
});

app.listen(port, () => console.log(`Mars Rover Dashboard listening on port ${port}!`));