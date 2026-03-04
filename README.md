# VotoChain 🗳️

Sistema de votación descentralizado en blockchain para democratización de partidos políticos en Ecuador.

## ¿Qué es?

VotoChain es un sistema electoral basado en smart contracts de Ethereum que permite a partidos políticos realizar elecciones internas y consultas ciudadanas de forma transparente, inmutable y auditable.

## Características

- Smart contract en Solidity con verificación de identidad en tres capas
- Verificación cruzada: Registro Civil + CNE + padrón del partido
- Autenticación por cédula y PIN personal
- Interfaz web accesible desde cualquier dispositivo sin wallet
- Panel de administración para el CNE
- Padrones electorales en formato xlsx editables
- Períodos electorales automáticos e incorruptibles

## Stack tecnológico

- Solidity — Smart contracts
- Hardhat — Entorno de desarrollo blockchain
- Ethers.js — Conexión con la blockchain
- Node.js + Express — Servidor backend
- HTML/CSS/JS — Interfaz web

## Instalación
```bash
git clone https://github.com/Philo404/votacion-blockchain
cd votacion-blockchain
npm install
```

Crea un archivo `.env`:
```
PRIVATE_KEY=tu_private_key
DIRECCION_CONTRATO=tu_direccion
RPC_URL=http://127.0.0.1:8545
PORT=3000
```

## Uso
```bash
# Terminal 1 — Red local
npx hardhat node

# Terminal 2 — Desplegar contrato
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 — Servidor
node server.js
```

Abre `http://localhost:3000/votacion.html` para votar o `http://localhost:3000/admin.html` para administrar.

## Motivación

Ecuador enfrenta una crisis de representación política. Este proyecto propone blockchain como herramienta para garantizar democracia interna real en los partidos políticos, con miras a escalar a consultas legislativas participativas.

## Autor

Desarrollado por Philosophic404 — Politólogo y desarrollador.
