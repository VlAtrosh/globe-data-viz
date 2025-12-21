let scene, camera, renderer, controls;
let earth, countries = [];
let currentDataType = 'population';

let countryData = [
  {
    name: "Россия",
    lat: 61,
    lon: 105,
    population: 144000000,
    gdp: 1699.877,
    gdpPerCapita: 11651,
    color: "#ff4444"
  },
  {
    name: "США",
    lat: 38,
    lon: -97,
    population: 331000000,
    gdp: 22996.100,
    gdpPerCapita: 69400,
    color: "#4444ff"
  },
  {
    name: "Китай",
    lat: 35,
    lon: 105,
    population: 1444216107,
    gdp: 17734.063,
    gdpPerCapita: 12556,
    color: "#ffa500"
  },
  {
    name: "Индия",
    lat: 20,
    lon: 77,
    population: 1393409038,
    gdp: 3176.298,
    gdpPerCapita: 2277,
    color: "#44ff44"
  },
  {
    name: "Бразилия",
    lat: -14,
    lon: -51,
    population: 212559417,
    gdp: 1839.758,
    gdpPerCapita: 8650,
    color: "#ffff44"
  },
  {
    name: "Германия",
    lat: 51,
    lon: 10,
    population: 83783942,
    gdp: 3863.344,
    gdpPerCapita: 46506,
    color: "#ff44ff"
  },
  {
    name: "Япония",
    lat: 36,
    lon: 138,
    population: 126476461,
    gdp: 5064.873,
    gdpPerCapita: 40113,
    color: "#44ffff"
  }
];


let earthTexture = null;


async function init() {
    console.log('Запуск Globe Data Viz...');
    

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
    

    setupEventListeners();
    
    window.addEventListener('resize', onWindowResize);
    

    animate();
    
    console.log('Приложение запущено!');
}

async function loadEarthTexture() {
    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
            (texture) => {
                earthTexture = texture;
                console.log('Текстура Земли загружена');
                resolve();
            },
            undefined,
            (error) => {
                console.warn('Не удалось загрузить текстуру Земли, используем стандартный материал:', error);
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
    
    console.log('Земля создана!', earthTexture ? 'С текстурой' : 'Без текстуры');
}


function createDataBars() {

    countries.forEach(country => {
        scene.remove(country.bar);
    });
    countries = [];
    

    const maxPopulation = Math.max(...countryData.map(c => c.population));
    const maxGDP = Math.max(...countryData.map(c => c.gdp));
    const maxGDPPerCapita = Math.max(...countryData.map(c => c.gdpPerCapita));
    

    countryData.forEach(country => {
  
        const phi = (90 - country.lat) * Math.PI / 180;
        const theta = (country.lon + 180) * Math.PI / 180;
        
        const earthRadius = 5; 
        const barOffset = 0.15; 
        
 
        const x = -(earthRadius + barOffset) * Math.sin(phi) * Math.cos(theta);
        const y = (earthRadius + barOffset) * Math.cos(phi);
        const z = (earthRadius + barOffset) * Math.sin(phi) * Math.sin(theta);
        
        let height = 0;
        let color = new THREE.Color(country.color);
        
        switch(currentDataType) {
            case 'population':
                height = (country.population / maxPopulation) * 6;
      
                const gdpRatio = country.gdpPerCapita / maxGDPPerCapita;
                color = getColorFromValue(gdpRatio);
                break;
            case 'gdp':
                height = (country.gdp / maxGDP) * 6;
              
                const popRatio = country.population / maxPopulation;
                color = getColorFromValue(popRatio);
                break;
            case 'gdpPerCapita':
                height = (country.gdpPerCapita / maxGDPPerCapita) * 6;
            
                const gdpValueRatio = country.gdp / maxGDP;
                color = getColorFromValue(gdpValueRatio);
                break;
        }
        
       
        height = Math.max(height, 0.3);
        
   
        const barGeometry = new THREE.CylinderGeometry(0.08, 0.12, height, 8);
        const barMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 100,
            specular: 0x333333
        });
        
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        
      
        bar.position.set(x, y, z);
        

        const direction = new THREE.Vector3(x, y, z).normalize();
        bar.lookAt(direction.multiplyScalar(-1)); 
        
     
        bar.rotateX(Math.PI / 2);
        
        
        bar.translateOnAxis(new THREE.Vector3(0, 1, 0), height / 2);
        
 
        scene.add(bar);
        

        const topGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const topMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.copy(bar.position);
        top.translateOnAxis(new THREE.Vector3(0, 1, 0), height / 2);
        bar.add(top);
        
   
        countries.push({
            name: country.name,
            bar: bar,
            data: country,
            position: new THREE.Vector3(x, y, z)
        });
    });
    
    updateStats();
    console.log(`Создано ${countries.length} столбиков данных`);
}


function getColorFromValue(value) {
 
    const hue = value * 120; 
    return new THREE.Color(`hsl(${hue}, 80%, 50%)`);
}


function getViridisColor(value) {
  
    const colors = [
        '#440154', '#482475', '#414487', '#355f8d', 
        '#2a788e', '#21918c', '#22a884', '#44bf70', 
        '#7ad151', '#bddf26', '#fde725'
    ];
    const index = Math.min(Math.floor(value * colors.length), colors.length - 1);
    return new THREE.Color(colors[index]);
}


function addLighting() {

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.2);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);
    
 
    const bottomLight = new THREE.DirectionalLight(0x4444ff, 0.1);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);
}


function setupEventListeners() {
  
    const dataTypeSelect = document.getElementById('dataType');
    dataTypeSelect.addEventListener('change', function(e) {
        currentDataType = e.target.value;
        createDataBars();
    });
    
 
    const resetButton = document.getElementById('resetCamera');
    resetButton.addEventListener('click', function() {
        controls.reset();
        camera.position.set(0, 5, 20);
        controls.target.set(0, 0, 0);
    });
    

    const rotateButton = document.getElementById('toggleAutoRotate');
    rotateButton.addEventListener('click', function() {
        controls.autoRotate = !controls.autoRotate;
        this.textContent = controls.autoRotate ? 
            ' Автовращение: Вкл' : ' Автовращение: Выкл';
    });
    
  
    const scaleSlider = document.getElementById('barScale');
    const scaleValue = document.getElementById('scaleValue');
    scaleSlider.addEventListener('input', function(e) {
        const scale = parseFloat(e.target.value);
        scaleValue.textContent = scale.toFixed(1);
        
        countries.forEach(country => {
            country.bar.scale.y = scale;
     
            if (country.bar.children[0]) {
                country.bar.children[0].scale.setScalar(1/scale);
            }
        });
    });
    

    const playButton = document.getElementById('playAnimation');
    playButton.addEventListener('click', function() {
        this.textContent = this.textContent.includes('Включить') ?
            ' Остановить анимацию' : '▶️ Включить анимацию по годам';
 
    });
    

    const colorSchemeSelect = document.getElementById('colorScheme');
    colorSchemeSelect.addEventListener('change', function(e) {

        console.log('Выбрана цветовая схема:', e.target.value);
    });
    
 
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    

    renderer.domElement.addEventListener('click', onClickCountry);
}


function updateStats() {
    const totalPopulation = countryData.reduce((sum, c) => sum + c.population, 0);
    const totalGDP = countryData.reduce((sum, c) => sum + c.gdp, 0);
    
    document.getElementById('countryCount').textContent = countryData.length;
    document.getElementById('totalPopulation').textContent = formatNumber(totalPopulation);
    document.getElementById('totalGDP').textContent = (totalGDP / 1000).toFixed(1);
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
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
 
    const intersects = raycaster.intersectObjects(
        countries.map(c => c.bar)
    );
    
    const infoBox = document.getElementById('info-box');
    
    if (intersects.length > 0) {
        const countryObj = countries.find(c => c.bar === intersects[0].object);
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
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(
        countries.map(c => c.bar)
    );
    
    if (intersects.length > 0) {
        const countryObj = countries.find(c => c.bar === intersects[0].object);
        if (countryObj) {
    
            const targetPosition = countryObj.position.clone().multiplyScalar(1.8);
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
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}


function animate() {
    requestAnimationFrame(animate);
    
    
    controls.update();
    renderer.render(scene, camera);
}


window.addEventListener('DOMContentLoaded', init);


