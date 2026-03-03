const hre = require("hardhat");

async function main() {
    // Dirección del contrato ya desplegado
    const direccionContrato = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const Votacion = await hre.ethers.getContractFactory ("Votacion");
    const votacion = Votacion.attach(direccionContrato);

    // Simulamos que el votante ingresa su cédula
    const cedula = "1701713123";
    const candidato = "Jaime Roldós";

    console.log ("===Portal de Votación===");
    console.log ("Cédula:", cedula);
    console.log ("Candidato elegido:", candidato);

    try {
        await votacion.votar (cedula, candidato);
        console.log ("✓ Voto registrado exitosamente");
    } catch (error) {
        console.log ("⚠ Error:", error.message);
    }
}

main().catch (console.error);
