require("dotenv").config();
const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const { ethers } = require("ethers");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const DIRECCION_CONTRATO = process.env.DIRECCION_CONTRATO || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PORT = process.env.PORT || 3000;

const ABI = [
    "function votar(string memory cedula, string memory candidato) public",
    "function obtenerVotos(string memory candidato) public view returns (uint)",
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contrato = new ethers.Contract(DIRECCION_CONTRATO, ABI, wallet);

function leerXLSX(ruta) {
    try {
        const wb = XLSX.readFile(ruta);
        const ws = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(ws);
    } catch (e) {
        return [];
    }
}

function cargarPadrones() {
    const registroCivil = leerXLSX("padrones/registro_civil.xlsx");
    const cne = leerXLSX("padrones/cne.xlsx");
    const partido = leerXLSX("padrones/partido.xlsx");
    const vivosCivil = new Set(registroCivil.filter(r => r["Estado"] === "activo").map(r => String(r["Cédula"])));
    const habilitadosCNE = new Set(cne.filter(r => r["Estado"] === "habilitado").map(r => String(r["Cédula"])));
    const militantes = new Map(partido.map(r => [String(r["Cédula"]), { nombre: r["Nombre"], pin: String(r["PIN"]) }]));
    return { vivosCivil, habilitadosCNE, militantes };
}

app.post("/api/verificar-cedula", (req, res) => {
    const { cedula } = req.body;
    if (!cedula || cedula.length !== 10 || !/^\d+$/.test(cedula)) return res.json({ valido: false, mensaje: "Cédula inválida." });
    const { vivosCivil, habilitadosCNE, militantes } = cargarPadrones();
    if (!vivosCivil.has(cedula)) return res.json({ valido: false, mensaje: "Cédula no válida en Registro Civil." });
    if (!habilitadosCNE.has(cedula)) return res.json({ valido: false, mensaje: "Cédula inhabilitada según el CNE." });
    if (!militantes.has(cedula)) return res.json({ valido: false, mensaje: "Cédula no registrada en el padrón del partido." });
    res.json({ valido: true, mensaje: "Cédula verificada. Ingresa tu PIN." });
});

app.post("/api/verificar", (req, res) => {
    const { cedula, pin } = req.body;
    if (!cedula || cedula.length !== 10 || !/^\d+$/.test(cedula)) return res.json({ valido: false, mensaje: "Cédula inválida." });
    if (!pin || pin.trim() === "") return res.json({ valido: false, mensaje: "Ingresa tu PIN." });
    const { vivosCivil, habilitadosCNE, militantes } = cargarPadrones();
    if (!vivosCivil.has(cedula)) return res.json({ valido: false, mensaje: "Cédula no válida en Registro Civil." });
    if (!habilitadosCNE.has(cedula)) return res.json({ valido: false, mensaje: "Cédula inhabilitada según el CNE." });
    if (!militantes.has(cedula)) return res.json({ valido: false, mensaje: "Cédula no registrada en el padrón del partido." });
    const { nombre, pin: pinRegistrado } = militantes.get(cedula);
    if (pin.trim() !== pinRegistrado) return res.json({ valido: false, mensaje: "PIN incorrecto." });
    res.json({ valido: true, nombre, mensaje: `Bienvenido/a, ${nombre}` });
});

app.post("/api/votar", async (req, res) => {
    const { cedula, candidato } = req.body;
    if (!cedula || !candidato) return res.json({ exito: false, mensaje: "Datos incompletos." });
    try {
        const tx = await contrato.votar(cedula, candidato);
        await tx.wait();
        res.json({ exito: true, mensaje: `Voto por ${candidato} registrado en blockchain.`, tx: tx.hash });
    } catch (error) {
        res.json({ exito: false, mensaje: error.reason || error.message });
    }
});

app.get("/api/resultados", async (req, res) => {
    try {
        const candidatos = ["Jaime Roldós", "Rafael Correa", "Noboa"];
        const resultados = await Promise.all(candidatos.map(async c => ({ candidato: c, votos: Number(await contrato.obtenerVotos(c)) })));
        res.json({ exito: true, resultados });
    } catch (error) {
        res.json({ exito: false, mensaje: error.message });
    }
});

app.post("/api/subir-padron", express.raw({ type: "application/octet-stream", limit: "10mb" }), (req, res) => {
    const { tipo } = req.query;
    const nombres = { "civil": "padrones/registro_civil.xlsx", "cne": "padrones/cne.xlsx", "partido": "padrones/partido.xlsx" };
    if (!nombres[tipo]) return res.json({ exito: false, mensaje: "Tipo inválido." });
    fs.writeFileSync(nombres[tipo], req.body);
    res.json({ exito: true, mensaje: `Padrón ${tipo} actualizado.` });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n=== VotoChain Server ===`);
    console.log(`http://0.0.0.0:${PORT}`);
    console.log(`Contrato: ${DIRECCION_CONTRATO}\n`);
});
