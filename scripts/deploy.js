const hre = require("hardhat");

async function main() {
    const [cne] = await hre.ethers.getSigners();

    // Obtener fee data y duplicarla para reemplazar transacciones pendientes
    const feeData = await hre.ethers.provider.getFeeData();
    const overrides = {
        maxFeePerGas: feeData.maxFeePerGas * 2n,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 2n,
    };

    const ahora = (await hre.ethers.provider.getBlock("latest")).timestamp;

    let config;
    if (require("fs").existsSync("./proceso-config.json")) {
        config = JSON.parse(require("fs").readFileSync("./proceso-config.json", "utf8"));
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
    console.log(`Red: ${hre.network.name}`);

    const Votacion = await hre.ethers.getContractFactory("Votacion");
    const votacion = await Votacion.deploy(
        config.titulo,
        config.tipo,
        config.inicioInscripcion,
        config.finInscripcion,
        config.inicioVotacion,
        config.finVotacion,
        overrides
    );
    await votacion.waitForDeployment();

    const direccion = await votacion.getAddress();
    console.log(`Contrato desplegado en: ${direccion}`);
    console.log(`CNE: ${cne.address}`);

    // Registrar candidatos
    for (const candidato of config.candidatos) {
        const tx = await votacion.agregarCandidato(candidato, overrides);
        await tx.wait();
        console.log(`  ✓ Candidato: ${candidato}`);
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
            await (await votacion.registrarCiudadano(cedula, overrides)).wait();
            await (await votacion.agregarMilitante(cedula, overrides)).wait();
        }
        console.log(`✓ Padrón cargado: ${militantes.length} militantes`);
    } else if (config.cedulas) {
        for (const cedula of config.cedulas) {
            await (await votacion.registrarCiudadano(cedula, overrides)).wait();
            await (await votacion.agregarMilitante(cedula, overrides)).wait();
        }
        console.log("✓ Padrón cargado desde config");
    }

    require("fs").writeFileSync("./contrato-activo.json", JSON.stringify({ direccion }));
    console.log(`\n✅ Contrato activo guardado: ${direccion}`);
    console.log(`👉 Agrega esto a tu .env:`);
    console.log(`   DIRECCION_CONTRATO=${direccion}`);
}

main().catch(console.error);
