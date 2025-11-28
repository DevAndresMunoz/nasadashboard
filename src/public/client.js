const { Map, List } = Immutable;

// Initial state using Immutable.js
let store = Map({
    user: Map({ name: "Explorer" }),
    rovers: List(['Curiosity', 'Opportunity', 'Spirit', 'Perseverance']),
    selectedRover: 'Curiosity',
    roverData: Map(),
    loading: false,
    error: null
});

const root = document.getElementById('root');

const updateStore = (newState) => {
    store = store.merge(newState);
    render(root, store);
};

const render = (root, state) => {
    root.innerHTML = App(state);
    attachEventListeners();
};

const createRoverClickHandler = (roverName) => (event) => {
    event.preventDefault();
    updateStore(Map({ 
        selectedRover: roverName, 
        loading: true 
    }));
    getRoverImages(roverName);
};

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
            <h1>Mars Rover Dashboard</h1>
            <p>Explore images from NASA's Mars Rovers</p>
        </header>
    `;
};

// Footer component
const Footer = () => {
    return `
        <footer>
            <p>Data provided by NASA's Image and Video Library | Built with Functional Programming</p>
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
        return `<div class="loading">Loading ${selectedRover} images...</div>`;
    }
    
    if (error) {
        return `<div class="error">Error: ${error}</div>`;
    }
    
    if (!roverData) {
        return `<div class="loading">Select a rover to view images</div>`;
    }
    
    return `
        ${RoverInfo(selectedRover, roverData)}
        ${ImageGallery(selectedRover, roverData)}
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

// Pure function to get rover information
const getRoverInfo = (roverName) => {
    const roverInfo = {
        'Curiosity': {
            launch: '2011-11-26',
            landing: '2012-08-06',
            status: 'Active',
            description: 'Part of NASA\'s Mars Science Laboratory mission, Curiosity is the largest and most capable rover ever sent to Mars.'
        },
        'Opportunity': {
            launch: '2003-07-07',
            landing: '2004-01-25',
            status: 'Complete',
            description: 'Opportunity operated for almost 15 years, far exceeding its planned 90-day mission.'
        },
        'Spirit': {
            launch: '2003-06-10',
            landing: '2004-01-04',
            status: 'Complete',
            description: 'Spirit operated for over six years, discovering evidence that Mars was once much wetter than it is today.'
        },
        'Perseverance': {
            launch: '2020-07-30',
            landing: '2021-02-18',
            status: 'Active',
            description: 'The newest Mars rover, seeking signs of ancient life and collecting samples for future return to Earth.'
        }
    };
    
    return roverInfo[roverName] || {};
};

// Rover information component
const RoverInfo = (roverName, roverData) => {
    const info = getRoverInfo(roverName);
    const totalImages = roverData.collection?.metadata?.total_hits || 0;
    
    return `
        <div class="rover-info">
            <h2>${roverName} Rover</h2>
            <p class="rover-description">${info.description}</p>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span>${info.status}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Launch Date:</span>
                    <span>${formatDate(info.launch)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Landing Date:</span>
                    <span>${formatDate(info.landing)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Images Found:</span>
                    <span>${totalImages.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
};

// Pure function to extract image URL from links array
const getImageUrl = (links) => {
    if (!links || links.length === 0) return '';
    const imageLink = links.find(link => link.render === 'image');
    return imageLink ? imageLink.href : '';
};

// Image gallery component using map
const ImageGallery = (roverName, roverData) => {
    const items = roverData.collection?.items || [];
    
    if (items.length === 0) {
        return `<div class="loading">No images found for ${roverName}</div>`;
    }
    
    // Use map to transform image data into HTML (limiting to 24 images)
    const photoItems = items.slice(0, 24).map(item => {
        const data = item.data[0];
        const imageUrl = getImageUrl(item.links);
        const title = data.title || 'Untitled';
        const description = data.description || 'No description available';
        const dateCreated = formatDate(data.date_created);
        
        return `
            <div class="gallery-item">
                <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Available'">
                <div class="image-info">
                    <p class="image-title"><strong>${title}</strong></p>
                    <p class="image-description">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                    <p><strong>Date:</strong> ${dateCreated}</p>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="image-gallery">
            <h3>Images from ${roverName}</h3>
            <div class="gallery-grid">
                ${photoItems}
            </div>
        </div>
    `;
};

// ------------------------------------------------------  API CALLS

// Pure function to construct API URL
const createRoverImagesUrl = (roverName) => {
    return `/rover/${roverName.toLowerCase()}/images`;
};

// Fetch rover images
const getRoverImages = async (roverName) => {
    try {
        const url = createRoverImagesUrl(roverName);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch images: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update store with new rover data
        const currentRoverData = store.get('roverData');
        updateStore(Map({
            roverData: currentRoverData.set(roverName, data),
            loading: false,
            error: null
        }));
        
    } catch (err) {
        console.error('Error fetching rover images:', err);
        updateStore(Map({ 
            loading: false, 
            error: 'Failed to load rover images. Please try again.' 
        }));
    }
};

// Load initial data when page loads
window.addEventListener('load', () => {
    render(root, store);
    const initialRover = store.get('selectedRover');
    updateStore(Map({ loading: true }));
    getRoverImages(initialRover);
});