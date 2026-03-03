const hre = require("hardhat");

async function main() {
    const [cne] = await hre.ethers.getSigners();
    
    const bloque = await hre.ethers.provider.getBlock("latest");
    const ahora = bloque.timestamp;

    // Períodos muy amplios para pruebas
    const inicioInscripcion = ahora - 10;
    const finInscripcion = ahora + 86400;    // 24 horas
    const inicioVotacion = ahora - 10;
    const finVotacion = ahora + 86400;       // 24 horas

    console.log("=== Sistema Electoral Ecuador ===\n");

    const Votacion = await hre.ethers.getContractFactory("Votacion");
    const votacion = await Votacion.deploy(
        inicioInscripcion,
        finInscripcion,
        inicioVotacion,
        finVotacion
    );
    await votacion.waitForDeployment();

    const direccion = await votacion.getAddress();
    console.log("Contrato desplegado en:", direccion);
    console.log("CNE:", cne.address);

    // Registrar ciudadanos
    await votacion.registrarCiudadano("1719022541");
    await votacion.registrarCiudadano("1710468263");
    await votacion.registrarCiudadano("1715780241");
    await votacion.agregarMilitante("1719022541");
    await votacion.agregarMilitante("1710468263");
    await votacion.agregarMilitante("1715780241");
    console.log("✓ Padrón cargado");

    // Candidatos
    await votacion.agregarCandidato("Jaime Roldós");
    await votacion.agregarCandidato("Rafael Correa");
    await votacion.agregarCandidato("Noboa");
    console.log("✓ Candidatos registrados");

    console.log("\nSistema listo. Dirección del contrato:", direccion);
}

main().catch(console.error);
