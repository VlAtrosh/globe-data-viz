let scene, camera, renderer, controls;
let earth, countries = [];
let currentDataType = 'population';
let countryData = [];
let earthTexture = null;
let isLoading = true;
let baseBarScale = 1.5;

async function init() {
    showLoadingMessage();
    await loadCountryData();
    
    if (countryData.length === 0) {
        hideLoadingMessage();
        createBasicScene();
        return;
    }
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f);
    
    const container = document.getElementById('canvas-container');
    camera = new THREE.PerspectiveCamera(
        60, 
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 20);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.enablePan = false;
    
    await loadEarthTexture();
    
    createEarth();
    createDataBars();
    addLighting();
    
    hideLoadingMessage();
    setupEventListeners();
    window.addEventListener('resize', onWindowResize);
    animate();
}

function showLoadingMessage() {
    const infoBox = document.getElementById('info-box');
    infoBox.style.display = 'block';
    infoBox.innerHTML = `
        <h3> Загрузка данных...</h3>
        <p>Пожалуйста, подождите</p>
        <div style="margin-top: 10px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px;">
            <div id="loading-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #00c6ff, #0072ff); border-radius: 2px; transition: width 0.3s;"></div>
        </div>
    `;
    
    let progress = 0;
    const loadingBar = document.getElementById('loading-bar');
    const interval = setInterval(() => {
        progress += 5;
        if (loadingBar) loadingBar.style.width = Math.min(progress, 90) + '%';
        if (progress >= 90) clearInterval(interval);
    }, 100);
}

function hideLoadingMessage() {
    const infoBox = document.getElementById('info-box');
    const loadingBar = document.getElementById('loading-bar');
    
    if (loadingBar) loadingBar.style.width = '100%';
    
    setTimeout(() => {
        infoBox.style.display = 'none';
        infoBox.innerHTML = `
            <h3 id="country-name"></h3>
            <p id="country-data"></p>
        `;
        isLoading = false;
    }, 300);
}

function createBasicScene() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f);
    
    camera = new THREE.PerspectiveCamera(
        60, 
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 15);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x1a3a5f,
        specular: 0x333333,
        shininess: 5,
        transparent: true,
        opacity: 0.9
    });
    
    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
    
    addLighting();
    
    const warningText = document.createElement('div');
    warningText.style.position = 'absolute';
    warningText.style.top = '50%';
    warningText.style.left = '50%';
    warningText.style.transform = 'translate(-50%, -50%)';
    warningText.style.color = '#ff6b6b';
    warningText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    warningText.style.padding = '20px';
    warningText.style.borderRadius = '10px';
    warningText.style.textAlign = 'center';
    warningText.innerHTML = `
        <h3> Нет данных</h3>
        <p>Файл countries.json не загружен или пуст</p>
        <p>Проверьте наличие файла в папке data/</p>
    `;
    container.appendChild(warningText);
    
    window.addEventListener('resize', onWindowResize);
    animate();
}

async function loadCountryData() {
    const possiblePaths = [
        'data/countries.json',
        './data/countries.json',
        'countries.json',
        '../data/countries.json',
        window.location.pathname.replace(/\/[^\/]*$/, '') + '/data/countries.json'
    ];
    
    for (const path of possiblePaths) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const text = await response.text();
                if (!text.trim()) continue;
                
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    countryData = data;
                    return;
                }
            }
        } catch (error) {
            continue;
        }
    }
    countryData = [];
}

async function loadEarthTexture() {
    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
            (texture) => {
                earthTexture = texture;
                resolve();
            },
            undefined,
            (error) => {
                earthTexture = null;
                resolve();
            }
        );
    });
}

function createEarth() {
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    
    let material;
    if (earthTexture) {
        material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            specular: new THREE.Color(0x333333),
            shininess: 5,
            transparent: true,
            opacity: 1.0
        });
    } else {
        material = new THREE.MeshPhongMaterial({
            color: 0x1a3a5f,
            specular: 0x333333,
            shininess: 5,
            transparent: true,
            opacity: 0.9
        });
    }
    
    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
    
    const atmosphereGeometry = new THREE.SphereGeometry(5.1, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earth.add(atmosphere);
}

function createDataBars() {
    countries.forEach(country => {
        if (country.bar && country.bar.parent) {
            scene.remove(country.bar);
        }
    });
    countries = [];
    
    if (countryData.length === 0) return;
    
    const maxPopulation = Math.max(...countryData.map(c => c.population));
    const maxGDP = Math.max(...countryData.map(c => c.gdp));
    const maxGDPPerCapita = Math.max(...countryData.map(c => c.gdpPerCapita));
    
    const exaggerationFactor = 1.5;
    
    countryData.forEach((country) => {
        const phi = (90 - country.lat) * Math.PI / 180;
        const theta = (country.lon + 180) * Math.PI / 180;
        
        const earthRadius = 5;
        const barOffset = 0;
        
        const x = -(earthRadius + barOffset) * Math.sin(phi) * Math.cos(theta);
        const y = (earthRadius + barOffset) * Math.cos(phi);
        const z = (earthRadius + barOffset) * Math.sin(phi) * Math.sin(theta);
        
        let height = 0;
        let color = new THREE.Color();
        
        switch(currentDataType) {
            case 'population':
                height = (country.population / maxPopulation) * 6 * exaggerationFactor;
                const gdpRatio = country.gdpPerCapita / maxGDPPerCapita;
                color = getColorFromValue(gdpRatio);
                break;
            case 'gdp':
                height = (country.gdp / maxGDP) * 6 * exaggerationFactor;
                const popRatio = country.population / maxPopulation;
                color = getColorFromValue(popRatio);
                break;
            case 'gdpPerCapita':
                height = (country.gdpPerCapita / maxGDPPerCapita) * 6 * exaggerationFactor;
                const gdpValueRatio = country.gdp / maxGDP;
                color = getColorFromValue(gdpValueRatio);
                break;
        }
        
        height = Math.max(height, 0.3);
        height *= baseBarScale;
        
        const barGeometry = new THREE.CylinderGeometry(0.08, 0.08, height, 8);
        const barMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 100,
            specular: 0x333333
        });
        
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        
        bar.position.set(x, y, z);
        
        const direction = new THREE.Vector3(x, y, z).normalize();
        bar.lookAt(direction.multiplyScalar(100));
        bar.rotateX(Math.PI / 2);
        bar.translateOnAxis(new THREE.Vector3(0, 1, 0), height / 2);
        
        const topGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const topMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, height / 2, 0);
        bar.add(top);
        
        scene.add(bar);
        
        countries.push({
            name: country.name,
            bar: bar,
            data: country,
            position: new THREE.Vector3(x, y, z),
            baseHeight: height
        });
    });
    
    updateStats();
}

function applyScaleToAllBars() {
    if (countries.length === 0) return;
    
    const scaleSlider = document.getElementById('barScale');
    const currentScale = scaleSlider ? parseFloat(scaleSlider.value) : baseBarScale;
    
    countries.forEach(country => {
        if (country.bar && country.baseHeight) {
            scene.remove(country.bar);
            
            const newHeight = country.baseHeight * currentScale;
            
            const barGeometry = new THREE.CylinderGeometry(0.08, 0.08, newHeight, 8);
            const barMaterial = new THREE.MeshPhongMaterial({ 
                color: country.bar.material.color,
                shininess: 100,
                specular: 0x333333
            });
            
            const newBar = new THREE.Mesh(barGeometry, barMaterial);
            
            newBar.position.copy(country.position);
            
            const direction = country.position.clone().normalize();
            newBar.lookAt(direction.multiplyScalar(100));
            newBar.rotateX(Math.PI / 2);
            newBar.translateOnAxis(new THREE.Vector3(0, 1, 0), newHeight / 2);
            
            const topGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const topMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.set(0, newHeight / 2, 0);
            newBar.add(top);
            
            scene.add(newBar);
            
            country.bar = newBar;
        }
    });
}

function getColorFromValue(value) {
    const hue = (1 - value) * 240;
    return new THREE.Color(`hsl(${hue}, 80%, 50%)`);
}

function addLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(20, 20, 10);
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.2);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);
}

function setupEventListeners() {
    const dataTypeSelect = document.getElementById('dataType');
    if (dataTypeSelect) {
        dataTypeSelect.addEventListener('change', function(e) {
            currentDataType = e.target.value;
            createDataBars();
        });
    }
    
    const resetButton = document.getElementById('resetCamera');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            controls.reset();
            camera.position.set(0, 5, 20);
            controls.target.set(0, 0, 0);
        });
    }
    
    const rotateButton = document.getElementById('toggleAutoRotate');
    if (rotateButton) {
        rotateButton.addEventListener('click', function() {
            controls.autoRotate = !controls.autoRotate;
            this.textContent = controls.autoRotate ? 
                '⏸️ Автовращение: Вкл' : '▶️ Автовращение: Выкл';
        });
    }
    
    const scaleSlider = document.getElementById('barScale');
    const scaleValue = document.getElementById('scaleValue');
    
    if (scaleSlider && scaleValue) {
        scaleSlider.value = baseBarScale;
        scaleValue.textContent = baseBarScale.toFixed(1);
        
        scaleSlider.addEventListener('input', function(e) {
            const scale = parseFloat(e.target.value);
            scaleValue.textContent = scale.toFixed(1);
            baseBarScale = scale;
            createDataBars();
        });
    }
    
    const colorSchemeSelect = document.getElementById('colorScheme');
    if (colorSchemeSelect) {
        colorSchemeSelect.addEventListener('change', function(e) {
            // TODO: Реализовать смену цветовой схемы
        });
    }
    
    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('click', onClickCountry);
    }
    
    updateDataStatus();
}

function updateDataStatus() {
    const statusElement = document.getElementById('data-status');
    if (statusElement) {
        if (countryData.length > 0) {
            statusElement.textContent = `✅ Загружено ${countryData.length} стран | Three.js ${THREE.REVISION}`;
            statusElement.style.color = '#4CAF50';
        } else {
            statusElement.textContent = `❌ Нет данных | Three.js ${THREE.REVISION}`;
            statusElement.style.color = '#ff6b6b';
        }
    }
}

function updateStats() {
    if (countryData.length === 0) return;
    
    const totalPopulation = countryData.reduce((sum, country) => sum + country.population, 0);
    const totalGDP = countryData.reduce((sum, country) => sum + country.gdp, 0);
    
    const countryCount = document.getElementById('countryCount');
    const totalPopulationEl = document.getElementById('totalPopulation');
    const totalGDPEl = document.getElementById('totalGDP');
    
    if (countryCount) countryCount.textContent = countryData.length;
    if (totalPopulationEl) totalPopulationEl.textContent = formatNumber(totalPopulation);
    if (totalGDPEl) totalGDPEl.textContent = (totalGDP / 1000).toFixed(2);
}

function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + ' млрд';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + ' млн';
    }
    return num.toLocaleString('ru-RU');
}

function onMouseMove(event) {
    if (countries.length === 0) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const barMeshes = countries.map(c => c.bar);
    const intersects = raycaster.intersectObjects(barMeshes);
    
    const infoBox = document.getElementById('info-box');
    
    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const countryObj = countries.find(c => c.bar === hitMesh);
        
        if (countryObj) {
            infoBox.style.display = 'block';
            document.getElementById('country-name').textContent = countryObj.name;
            
            let dataText = '';
            switch(currentDataType) {
                case 'population':
                    dataText = `Население: ${formatNumber(countryObj.data.population)}<br>
                               ВВП: $${formatNumber(countryObj.data.gdp * 1e9)}<br>
                               ВВП на душу: $${formatNumber(countryObj.data.gdpPerCapita)}`;
                    break;
                case 'gdp':
                    dataText = `ВВП: $${formatNumber(countryObj.data.gdp * 1e9)}<br>
                               Население: ${formatNumber(countryObj.data.population)}<br>
                               ВВП на душу: $${formatNumber(countryObj.data.gdpPerCapita)}`;
                    break;
                case 'gdpPerCapita':
                    dataText = `ВВП на душу: $${formatNumber(countryObj.data.gdpPerCapita)}<br>
                               Население: ${formatNumber(countryObj.data.population)}<br>
                               ВВП: $${formatNumber(countryObj.data.gdp * 1e9)}`;
                    break;
            }
            
            document.getElementById('country-data').innerHTML = dataText;
            
            countries.forEach(c => {
                c.bar.material.emissive = new THREE.Color(0x000000);
            });
            countryObj.bar.material.emissive = new THREE.Color(0x222222);
        }
    } else {
        infoBox.style.display = 'none';
        countries.forEach(c => {
            c.bar.material.emissive = new THREE.Color(0x000000);
        });
    }
}

function onClickCountry(event) {
    if (countries.length === 0) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const barMeshes = countries.map(c => c.bar);
    const intersects = raycaster.intersectObjects(barMeshes);
    
    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const countryObj = countries.find(c => c.bar === hitMesh);
        
        if (countryObj) {
            const targetPosition = countryObj.position.clone().multiplyScalar(1.5);
            controls.target.copy(countryObj.position);
            
            const startPosition = camera.position.clone();
            const endPosition = new THREE.Vector3(
                targetPosition.x,
                targetPosition.y + 3,
                targetPosition.z + 8
            );
            
            const duration = 1000;
            const startTime = Date.now();
            
            function animateCamera() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeProgress = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                
                if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                }
            }
            
            animateCamera();
        }
    }
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !camera || !renderer) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
