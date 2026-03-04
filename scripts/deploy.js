const hre = require("hardhat");

async function main() {
    const [cne] = await hre.ethers.getSigners();
    const ahora = (await hre.ethers.provider.getBlock("latest")).timestamp;

    // Configuración del proceso electoral
    let config;
    if (require("fs").existsSync("./proceso-config.json")) {
        config = JSON.parse(require("fs").readFileSync("./proceso-config.json", "utf8"));
        // server.js escribe el campo como "opciones", normalizamos a "candidatos"
        if (!config.candidatos && config.opciones) config.candidatos = config.opciones;
    } else {
        config = {
            titulo: "Elección Presidente del Partido 2026",
            tipo: "eleccion",
            inicioInscripcion: ahora - 10,
            finInscripcion: ahora + 3600,
            inicioVotacion: ahora + 10,
            finVotacion: ahora + 86400,
            candidatos: ["Jaime Roldós", "Rafael Correa", "Noboa"],
            cedulas: ["1719022541", "1710468263", "1715780241", "1723456789"]
        };
    }

    console.log("=== Sistema Electoral Ecuador ===");

    const Votacion = await hre.ethers.getContractFactory("Votacion");
    const votacion = await Votacion.deploy(
        config.titulo,
        config.tipo,
        config.inicioInscripcion,
        config.finInscripcion,
        config.inicioVotacion,
        config.finVotacion
    );
    await votacion.waitForDeployment();

    const direccion = await votacion.getAddress();
    console.log(`Contrato desplegado en: ${direccion}`);
    console.log(`CNE: ${cne.address}`);

    // Registrar candidatos
    for (const candidato of config.candidatos) {
        await votacion.agregarCandidato(candidato);
    }
    console.log("✓ Candidatos registrados");

    // Cargar padrón desde xlsx si existe
    const XLSX = require("xlsx");
    const padronPath = "./padrones/partido.xlsx";
    if (require("fs").existsSync(padronPath)) {
        const wb = XLSX.readFile(padronPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const militantes = XLSX.utils.sheet_to_json(ws);
        for (const m of militantes) {
            const cedula = String(m["Cédula"]);
            await votacion.registrarCiudadano(cedula);
            await votacion.agregarMilitante(cedula);
        }
        console.log(`✓ Padrón cargado: ${militantes.length} militantes`);
    } else if (config.cedulas) {
        for (const cedula of config.cedulas) {
            await votacion.registrarCiudadano(cedula);
            await votacion.agregarMilitante(cedula);
        }
        console.log("✓ Padrón cargado desde config");
    }

    // Guardar dirección del contrato activo
    require("fs").writeFileSync("./contrato-activo.json", JSON.stringify({ direccion }));
    console.log(`Contrato activo: ${direccion}`);
}

main().catch(console.error);
