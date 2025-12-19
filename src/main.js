let scene, camera, renderer, controls;

// Инициализация
function init() {
    console.log('Запуск Globe Data Viz...');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f);
    
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 15;
    
    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    createEarth();
    
    addLighting();
    
    window.addEventListener('resize', onWindowResize);
    
    animate();
}


function createEarth() {
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    
    const material = new THREE.MeshPhongMaterial({
        color: 0x1a3a5f,
        specular: 0x333333,
        shininess: 5
    });
    
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.2;
    line.material.transparent = true;
    earth.add(line);
    
    console.log('Земля создана!');
}

function addLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (scene.children[0]) {
        scene.children[0].rotation.y += 0.001;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);