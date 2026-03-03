const hre = require("hardhat");

async function main() {
    const direccionContrato = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    const Votacion = await hre.ethers.getContractFactory("Votacion");
    const votacion = Votacion.attach(direccionContrato);

    const cedula = "1701713123";

    await votacion.registrarCiudadano(cedula);
    await votacion.agregarMilitante(cedula);
    console.log("✓ Ciudadano registrado:", cedula);
}

main().catch(console.error);
