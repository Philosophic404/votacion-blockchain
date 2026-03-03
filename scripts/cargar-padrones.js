const hre = require("hardhat");
const XLSX = require("xlsx");
const fs = require("fs");

function leerXLSX(ruta) {
    const wb = XLSX.readFile(ruta);
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws);
}

async function main() {
    const DIRECCION_CONTRATO = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

    const ABI = [
        "function registrarCiudadano(string memory cedula) public",
        "function agregarMilitante(string memory cedula) public",
    ];

    const [cne] = await hre.ethers.getSigners();
    const contrato = new hre.ethers.Contract(DIRECCION_CONTRATO, ABI, cne);

    console.log("=== Cargando padrones al contrato ===\n");

    // Leer los tres xlsx
    const registroCivil = leerXLSX("padrones/registro_civil.xlsx");
    const padronCNE = leerXLSX("padrones/cne.xlsx");
    const padronPartido = leerXLSX("padrones/partido.xlsx");

    // Crear sets para verificación cruzada
    const vivosCivil = new Set(
        registroCivil
            .filter(r => r["Estado"] === "activo")
            .map(r => String(r["Cédula"]))
    );

    const habilitadosCNE = new Set(
        padronCNE
            .filter(r => r["Estado"] === "habilitado")
            .map(r => String(r["Cédula"]))
    );

    const militantes = new Set(
        padronPartido.map(r => String(r["Cédula"]))
    );

    // Solo cargar cédulas que pasen las tres verificaciones
    let registrados = 0;
    let rechazados = 0;

    for (const cedula of militantes) {
        if (!vivosCivil.has(cedula)) {
            console.log(`⚠ ${cedula} — no consta en Registro Civil activo`);
            rechazados++;
            continue;
        }
        if (!habilitadosCNE.has(cedula)) {
            console.log(`⚠ ${cedula} — inhabilitado según CNE`);
            rechazados++;
            continue;
        }

        await contrato.registrarCiudadano(cedula);
        await contrato.agregarMilitante(cedula);
        
        // Buscar nombre para el log
        const persona = padronPartido.find(r => String(r["Cédula"]) === cedula);
        console.log(`✓ ${cedula} — ${persona?.Nombre} registrado`);
        registrados++;
    }

    console.log(`\n=== Resumen ===`);
    console.log(`✓ Registrados: ${registrados}`);
    console.log(`⚠ Rechazados: ${rechazados}`);
    console.log(`\nEl padrón está cargado en blockchain.`);
}

main().catch(console.error);
