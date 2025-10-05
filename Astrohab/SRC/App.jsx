import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls, Text, Stars } from "@react-three/drei";
import "./App.css";

// 🔄 Rotating effect for solar panels
function RotatingPanel({ children }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.005;
  });
  return <group ref={ref}>{children}</group>;
}

// 🧩 Module component — supports multiple shapes
function Module({ position, color, label, size, type }) {
  return (
    <group position={position}>
      <mesh rotation={type === "solar" ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        {type === "cube" && <boxGeometry args={[size, size, size]} />}
        {type === "sphere" && <sphereGeometry args={[size / 1.5, 32, 32]} />}
        {type === "cylinder" && <cylinderGeometry args={[size / 1.5, size / 1.5, size * 1.5, 32]} />}
        {type === "cone" && <coneGeometry args={[size / 1.2, size * 1.8, 32]} />}
        {type === "solar" && <planeGeometry args={[size * 3, size * 2]} />}
        {type === "tunnel" && <cylinderGeometry args={[size / 3, size / 3, size * 3, 32]} />}
        <meshStandardMaterial
          color={color}
          metalness={type === "solar" ? 0.8 : 0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function App() {
  const [modules, setModules] = useState([]);
  const [selected, setSelected] = useState(null);
  const [crew, setCrew] = useState(4);
  const [controlsMode, setControlsMode] = useState("translate");
  const transformRef = useRef();

  // ➕ Add module
  const addModule = () => {
    const types = ["cube", "sphere", "cylinder", "cone", "solar", "tunnel"];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = {
      cube: "#00aaff",
      sphere: "#ffcc00",
      cylinder: "#00ffaa",
      cone: "#ff4444",
      solar: "#2233ff",
      tunnel: "#aaaaaa",
    };

    const newModule = {
      id: Date.now(),
      label: type.charAt(0).toUpperCase() + type.slice(1),
      color: colors[type],
      size: 2,
      type,
      position: [Math.random() * 6 - 3, 0, Math.random() * 6 - 3],
    };
    setModules([...modules, newModule]);
    setSelected(newModule.id);
  };

  // 🗑 Delete selected module
  const deleteModule = () => {
    if (!selected) return alert("Select a module to delete!");
    setModules((prev) => prev.filter((m) => m.id !== selected));
    setSelected(null);
  };

  // ✏ Update selected module
  const updateSelected = (field, value) => {
    if (!selected) return;
    setModules((prev) =>
      prev.map((m) => (m.id === selected ? { ...m, [field]: value } : m))
    );
  };

  // 💾 Save layout
  const saveLayout = () => {
    localStorage.setItem("astrohab_layout", JSON.stringify(modules));
    alert("✅ Layout saved!");
  };

  // 📂 Load layout
  const loadLayout = () => {
    const data = localStorage.getItem("astrohab_layout");
    if (data) {
      setModules(JSON.parse(data));
      alert("📂 Layout loaded!");
    }
  };

  // ⬇ Export layout to JSON
  const exportLayout = () => {
    const blob = new Blob([JSON.stringify(modules, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "astrohab_layout.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ⬆ Import layout from JSON
  const importLayout = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setModules(data);
        alert("✅ Layout imported!");
      } catch (err) {
        alert("❌ Invalid JSON file!");
      }
    };
    reader.readAsText(file);
  };

  const selectedModule = modules.find((m) => m.id === selected);

  // 🧮 Resource calculations
  const dailyOxygen = (crew * 0.84).toFixed(2);
  const dailyWater = (crew * 2.5).toFixed(2);
  const dailyFood = (crew * 0.62).toFixed(2);

  return (
    <div className="app-container">
      {/* 🎮 3D Canvas */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ height: "100vh", width: "70vw", background: "#050823" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} fade />
        <OrbitControls makeDefault />

        {modules.map((m) => {
          const isSelected = selected === m.id;
          const moduleComponent =
            m.type === "solar" ? (
              <RotatingPanel>
                <Module {...m} />
              </RotatingPanel>
            ) : (
              <Module {...m} />
            );

          return (
            <React.Fragment key={m.id}>
              {isSelected ? (
                <TransformControls
                  ref={transformRef}
                  mode={controlsMode}
                  onMouseUp={() => {
                    const pos = transformRef.current.object.position;
                    setModules((prev) =>
                      prev.map((x) =>
                        x.id === m.id
                          ? { ...x, position: [pos.x, pos.y, pos.z] }
                          : x
                      )
                    );
                  }}
                >
                  {moduleComponent}
                </TransformControls>
              ) : (
                <mesh onClick={() => setSelected(m.id)}>{moduleComponent}</mesh>
              )}
            </React.Fragment>
          );
        })}
      </Canvas>

      {/* 📋 Sidebar */}
      <div className="sidebar">
        <h2>🔬 Resource Calculator</h2>

        <div className="input-row">
          <label>Number of Crew:</label>
          <input
            type="number"
            value={crew}
            onChange={(e) => setCrew(Number(e.target.value))}
          />
        </div>

        <p>🧪 Oxygen: {dailyOxygen} kg/day</p>
        <p>💧 Water: {dailyWater} L/day</p>
        <p>🍽 Food: {dailyFood} kg/day</p>

        <button className="btn" onClick={addModule}>➕ Add Module</button>
        <button className="btn red" onClick={deleteModule}>🗑 Delete Module</button>
        <button className="btn" onClick={saveLayout}>💾 Save Layout</button>
        <button className="btn" onClick={loadLayout}>📂 Load Layout</button>
        <button className="btn" onClick={exportLayout}>⬇ Export JSON</button>

        <label className="upload-btn">
          ⬆ Import JSON
          <input type="file" accept=".json" onChange={importLayout} hidden />
        </label>

        <hr />

        {selectedModule && (
          <div className="edit-panel">
            <h3>✏ Edit Module</h3>

            <div className="input-row">
              <label>Label:</label>
              <input
                value={selectedModule.label}
                onChange={(e) => updateSelected("label", e.target.value)}
              />
            </div>

            <div className="input-row">
              <label>Color:</label>
              <input
                type="color"
                value={selectedModule.color}
                onChange={(e) => updateSelected("color", e.target.value)}
              />
            </div>

            <div className="input-row">
              <label>Size:</label>
              <input
                type="number"
                min="1"
                value={selectedModule.size}
                onChange={(e) => updateSelected("size", Number(e.target.value))}
              />
            </div>

            <div className="input-row">
              <label>Type:</label>
              <select
                value={selectedModule.type}
                onChange={(e) => updateSelected("type", e.target.value)}
              >
                <option value="cube">Cube</option>
                <option value="sphere">Sphere</option>
                <option value="cylinder">Cylinder</option>
                <option value="cone">Cone</option>
                <option value="solar">Solar Panel</option>
                <option value="tunnel">Tunnel</option>
              </select>
            </div>

            <div className="input-row">
              <label>Transform Mode:</label>
              <select
                value={controlsMode}
                onChange={(e) => setControlsMode(e.target.value)}
              >
                <option value="translate">Move</option>
                <option value="rotate">Rotate</option>
                <option value="scale">Scale</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;