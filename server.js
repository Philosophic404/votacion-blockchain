require("dotenv").config();
const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const { ethers } = require("ethers");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "./" });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const DIRECCION_CONTRATO = process.env.DIRECCION_CONTRATO || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x9b29156888bba91a8df2df257ff6411500405155b0088801ca112ec87cca8852";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PORT = process.env.PORT || 3000;

console.log(process.env.PRIVATE_KEY);
/* console.log(process.env.PRIVATE_KEY.length); */

const ABI = [
    "function votar(string memory cedula, string memory candidato) public",
    "function abstenerse(string memory cedula) public",
    "function obtenerVotos(string memory candidato) public view returns (uint)",
    "function cerrarVotacion() public",
    "function obtenerInfo() public view returns (string memory, string memory, bool, uint, uint, uint, uint)",
    "function registrarCiudadano(string memory cedula) public",
    "function agregarMilitante(string memory cedula) public",
    "function totalParticipantes() public view returns (uint)",
    "function totalAbstenciones() public view returns (uint)",
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
let CONTRATO_ACTIVO = DIRECCION_CONTRATO;
if (fs.existsSync("./contrato-activo.json")) {
    CONTRATO_ACTIVO = JSON.parse(fs.readFileSync("./contrato-activo.json", "utf8")).direccion;
}
let contrato = new ethers.Contract(CONTRATO_ACTIVO, ABI, wallet);

// FIX 1: Eliminada variable "walletConNonce" que estaba declarada pero nunca se usaba.

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

app.post("/api/abstenerse", async (req, res) => {
    const { cedula } = req.body;
    try {
        const tx = await contrato.abstenerse(cedula);
        await tx.wait();
        res.json({ exito: true, mensaje: "Abstención registrada en blockchain." });
    } catch (error) {
        res.json({ exito: false, mensaje: error.reason || error.message });
    }
});

app.get("/api/resultados", async (req, res) => {
    try {
        const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/Votacion.sol/Votacion.json", "utf8"));
        const contratoCompleto = new ethers.Contract(await contrato.getAddress(), artifact.abi, wallet);
        const opciones = [];
        let i = 0;
        while (true) {
            try {
                const opcion = await contratoCompleto.candidatos(i);
                opciones.push(opcion);
                i++;
            } catch (e) { break; }
        }
        const resultados = await Promise.all(
            opciones.map(async c => ({ candidato: c, votos: Number(await contrato.obtenerVotos(c)) }))
        );
        res.json({ exito: true, resultados });
    } catch (error) {
        res.json({ exito: false, mensaje: error.message });
    }
});

app.get("/api/info-proceso", async (req, res) => {
    try {
        const [titulo, tipo, cerrado, inicioVotacion, finVotacion, totalParticipantes, totalAbstenciones] = await contrato.obtenerInfo();
        let descripcion = "";
        if (fs.existsSync("./proceso-config.json")) {
            const config = JSON.parse(fs.readFileSync("./proceso-config.json", "utf8"));
            descripcion = config.descripcion || "";
        }
        res.json({
            exito: true, titulo, tipo, cerrado, descripcion,
            inicioVotacion: Number(inicioVotacion),
            finVotacion: Number(finVotacion),
            totalParticipantes: Number(totalParticipantes),
            totalAbstenciones: Number(totalAbstenciones)
        });
    } catch (error) {
        res.json({ exito: false, mensaje: error.message });
    }
});

app.get("/api/documento-proceso", (req, res) => {
    const rutaPDF = "./documento-proceso.pdf";
    if (fs.existsSync(rutaPDF)) {
        res.setHeader("Content-Type", "application/pdf");
        res.sendFile(require("path").resolve(rutaPDF));
    } else {
        res.status(404).json({ exito: false, mensaje: "No hay documento adjunto." });
    }
});

const uploadMultiple = multer({ dest: "./documentos-proceso/" });
app.post("/api/subir-documento", uploadMultiple.array("pdfs", 10), (req, res) => {
    if (!req.files || req.files.length === 0) return res.json({ exito: false, mensaje: "No se recibieron archivos." });
    if (!fs.existsSync("./documentos-proceso")) fs.mkdirSync("./documentos-proceso");
    const guardados = [];
    req.files.forEach(function (file) {
        const destino = "./documentos-proceso/" + file.originalname;
        fs.renameSync(file.path, destino);
        guardados.push(file.originalname);
    });
    res.json({ exito: true, mensaje: guardados.length + " documento(s) subido(s).", archivos: guardados });
});
app.get("/api/documentos-proceso", (req, res) => {
    const carpeta = "./documentos-proceso";
    if (!fs.existsSync(carpeta)) return res.json({ exito: true, documentos: [] });
    const archivos = fs.readdirSync(carpeta).filter(f => f.endsWith(".pdf"));
    res.json({ exito: true, documentos: archivos });
});
app.get("/api/documento-proceso/:nombre", (req, res) => {
    const ruta = "./documentos-proceso/" + req.params.nombre;
    if (!fs.existsSync(ruta)) return res.status(404).json({ exito: false, mensaje: "Archivo no encontrado." });
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(require("path").resolve(ruta));
});

app.get("/api/opciones", async (req, res) => {
    try {
        const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/Votacion.sol/Votacion.json", "utf8"));
        const contratoCompleto = new ethers.Contract(
            await contrato.getAddress(), artifact.abi, wallet
        );
        const opciones = [];
        let i = 0;
        while (true) {
            try {
                const opcion = await contratoCompleto.candidatos(i);
                opciones.push(opcion);
                i++;
            } catch (e) {
                break;
            }
        }
        res.json({ exito: true, opciones });
    } catch (error) {
        res.json({ exito: false, mensaje: error.message });
    }
});

app.post("/api/cerrar-votacion", async (req, res) => {
    try {
        const tx = await contrato.cerrarVotacion();
        await tx.wait();
        res.json({ exito: true, mensaje: "Votación cerrada en blockchain." });
    } catch (error) {
        res.json({ exito: false, mensaje: error.reason || error.message });
    }
});

if (!fs.existsSync("./documentos-proceso")) fs.mkdirSync("./documentos-proceso");
const uploadProceso = multer({ dest: "./documentos-proceso/" });
app.post("/api/crear-proceso", uploadProceso.array("pdfs", 10), async (req, res) => {
    const { titulo, tipo, opciones, descripcion, inicioInscripcion, finInscripcion, inicioVotacion, finVotacion } = JSON.parse(req.body.datos);
    if (!titulo || !opciones || opciones.length < 2) {
        return res.json({ exito: false, mensaje: "Datos incompletos." });
    }
    try {
        // Limpiar documentos anteriores y guardar nuevos
        const path = require("path");
        const carpetaDocs = "./documentos-proceso";
        const guardados = [];

        if (!fs.existsSync(carpetaDocs)) {
            fs.mkdirSync(carpetaDocs);
        }

        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                console.log("Archivo temporal:", file.path);
                const destino = path.join(carpetaDocs, file.originalname);
                console.log("Destino:", destino);
                fs.renameSync(file.path, destino);
                guardados.push(file.originalname);
            });
        }
        const { execSync } = require("child_process");
        const ahora = Math.floor(Date.now() / 1000);
        const config = {
            titulo, tipo, descripcion: descripcion || "", opciones,
            inicioInscripcion: inicioInscripcion ? Math.floor(new Date(inicioInscripcion).getTime() / 1000) : ahora - 10,
            finInscripcion: finInscripcion ? Math.floor(new Date(finInscripcion).getTime() / 1000) : ahora + 3600,
            inicioVotacion: Math.floor(new Date(inicioVotacion).getTime() / 1000),
            finVotacion: Math.floor(new Date(finVotacion).getTime() / 1000)
        };
        fs.writeFileSync("./proceso-config.json", JSON.stringify(config));
        const output = execSync("npx hardhat run scripts/deploy.js --network localhost", { encoding: "utf8" });
        const match = output.match(/0x[a-fA-F0-9]{40}/);
        if (!match) return res.json({ exito: false, mensaje: "No se pudo obtener la dirección del contrato." });
        const direccion = match[0];
        contrato = new ethers.Contract(direccion, ABI, wallet);
        res.json({ exito: true, direccion, mensaje: 'Proceso "' + titulo + '" desplegado en ' + direccion });
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

process.on("uncaughtException", (err) => {
    console.error("Error no capturado:", err.message);
});

process.on("unhandledRejection", (reason) => {
    console.error("Promesa rechazada:", reason);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n=== VotoChain Server ===`);
    console.log(`http://0.0.0.0:${PORT}`);
    console.log(`Contrato: ${DIRECCION_CONTRATO}\n`);
});
