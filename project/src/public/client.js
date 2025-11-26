const { Map, List } = Immutable;

// Initial state using Immutable.js
let store = Map({
    user: Map({ name: "Explorer" }),
    rovers: List(['Curiosity', 'Opportunity', 'Spirit']),
    selectedRover: 'Curiosity',
    roverData: Map(),
    loading: false,
    error: null
});

// Add markup to the page
const root = document.getElementById('root');

// Pure function to update store
const updateStore = (newState) => {
    store = store.merge(newState);
    render(root, store);
};

// Pure function to render
const render = (root, state) => {
    root.innerHTML = App(state);
    attachEventListeners();
};

// Higher-order function that creates event handlers
const createRoverClickHandler = (roverName) => (event) => {
    event.preventDefault();
    updateStore(Map({ 
        selectedRover: roverName, 
        loading: true 
    }));
    getRoverData(roverName);
};

// Attach event listeners after render
const attachEventListeners = () => {
    const tabs = document.querySelectorAll('.rover-tab');
    tabs.forEach(tab => {
        const roverName = tab.dataset.rover;
        tab.addEventListener('click', createRoverClickHandler(roverName));
    });
};

// Main App component
const App = (state) => {
    return `
        ${Header()}
        <main>
            ${RoverTabs(state)}
            ${RoverContent(state)}
        </main>
        ${Footer()}
    `;
};

// ------------------------------------------------------  COMPONENTS

// Header component
const Header = () => {
    return `
        <header>
            <h1>🚀 Mars Rover Dashboard</h1>
        </header>
    `;
};

// Footer component
const Footer = () => {
    return `
        <footer>
            <p>Data provided by NASA's Mars Rover API | Built with Functional Programming</p>
        </footer>
    `;
};

// Rover tabs component
const RoverTabs = (state) => {
    const rovers = state.get('rovers');
    const selectedRover = state.get('selectedRover');
    
    const tabs = rovers.map(rover => 
        `<button class="rover-tab ${rover === selectedRover ? 'active' : ''}" data-rover="${rover}">
            ${rover}
        </button>`
    ).join('');
    
    return `
        <div class="rover-tabs">
            ${tabs}
        </div>
    `;
};

// Main content component
const RoverContent = (state) => {
    const loading = state.get('loading');
    const error = state.get('error');
    const selectedRover = state.get('selectedRover');
    const roverData = state.getIn(['roverData', selectedRover]);
    
    if (loading && !roverData) {
        return `<div class="loading">Loading ${selectedRover} data...</div>`;
    }
    
    if (error) {
        return `<div class="error">Error: ${error}</div>`;
    }
    
    if (!roverData) {
        return `<div class="loading">Select a rover to view data</div>`;
    }
    
    return `
        ${RoverInfo(roverData)}
        ${ImageGallery(roverData)}
    `;
};

// Pure function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

// Rover information component
const RoverInfo = (roverData) => {
    const manifest = roverData.photo_manifest;
    
    return `
        <div class="rover-info">
            <h2>${manifest.name} Rover</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span>${manifest.status}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Launch Date:</span>
                    <span>${formatDate(manifest.launch_date)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Landing Date:</span>
                    <span>${formatDate(manifest.landing_date)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Photos:</span>
                    <span>${manifest.total_photos.toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Max Sol:</span>
                    <span>${manifest.max_sol}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Max Date:</span>
                    <span>${formatDate(manifest.max_date)}</span>
                </div>
            </div>
        </div>
    `;
};

// Image gallery component using map
const ImageGallery = (roverData) => {
    const photos = roverData.latest_photos || [];
    
    if (photos.length === 0) {
        return `<div class="loading">No recent photos available</div>`;
    }
    
    // Use map to transform photo data into HTML
    const photoItems = photos.slice(0, 12).map(photo => `
        <div class="gallery-item">
            <img src="${photo.img_src}" alt="Mars photo by ${photo.rover.name}" loading="lazy">
            <div class="image-info">
                <p><strong>Camera:</strong> ${photo.camera.full_name}</p>
                <p><strong>Date:</strong> ${formatDate(photo.earth_date)}</p>
                <p><strong>Sol:</strong> ${photo.sol}</p>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="image-gallery">
            <h3>Latest Photos from ${roverData.photo_manifest.name}</h3>
            <div class="gallery-grid">
                ${photoItems}
            </div>
        </div>
    `;
};

// ------------------------------------------------------  API CALLS

// Pure function to construct API URL
const createRoverManifestUrl = (roverName) => {
    return `/rover/${roverName.toLowerCase()}/manifest`;
};

// Pure function to construct photos URL
const createRoverPhotosUrl = (roverName) => {
    return `/rover/${roverName.toLowerCase()}/latest-photos`;
};

// Fetch rover data
const getRoverData = async (roverName) => {
    try {
        // Fetch both manifest and latest photos
        const [manifestResponse, photosResponse] = await Promise.all([
            fetch(createRoverManifestUrl(roverName)),
            fetch(createRoverPhotosUrl(roverName))
        ]);
        
        const manifestData = await manifestResponse.json();
        const photosData = await photosResponse.json();
        
        // Combine the data
        const combinedData = {
            photo_manifest: manifestData.photo_manifest,
            latest_photos: photosData.latest_photos
        };
        
        // Update store with new rover data
        const currentRoverData = store.get('roverData');
        updateStore(Map({
            roverData: currentRoverData.set(roverName, combinedData),
            loading: false,
            error: null
        }));
        
    } catch (err) {
        console.error('Error fetching rover data:', err);
        updateStore(Map({ 
            loading: false, 
            error: 'Failed to load rover data. Please try again.' 
        }));
    }
};

// Load initial data when page loads
window.addEventListener('load', () => {
    render(root, store);
    const initialRover = store.get('selectedRover');
    updateStore(Map({ loading: true }));
    getRoverData(initialRover);
});