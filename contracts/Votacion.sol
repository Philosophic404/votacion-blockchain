// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Votacion {
    address public cne;
    string[] public candidatos;
    mapping(string => uint) public conteo;
    mapping(string => bool) public yaVoto;
    mapping(string => bool) public padronPartido;
    mapping(string => bool) public padronCNE;
    mapping(string => bool) public registroCivil;

    uint public inicioInscripcion;
    uint public finInscripcion;
    uint public inicioVotacion;
    uint public finVotacion;

    constructor(
        uint _inicioInscripcion,
        uint _finInscripcion,
        uint _inicioVotacion,
        uint _finVotacion
    ) {
        cne = msg.sender;
        inicioInscripcion = _inicioInscripcion;
        finInscripcion = _finInscripcion;
        inicioVotacion = _inicioVotacion;
        finVotacion = _finVotacion;
    }

    modifier soloEnInscripcion() {
        require(block.timestamp >= inicioInscripcion, "Inscripcion no ha comenzado");
        require(block.timestamp <= finInscripcion, "Inscripcion cerrada");
        _;
    }

    modifier soloEnVotacion() {
        require(block.timestamp >= inicioVotacion, "Votacion no ha comenzado");
        require(block.timestamp <= finVotacion, "Votacion cerrada");
        _;
    }

    function registrarCiudadano(string memory cedula) public soloEnInscripcion {
        require(msg.sender == cne, "Solo el CNE puede registrar");
        registroCivil[cedula] = true;
        padronCNE[cedula] = true;
    }

    function agregarMilitante(string memory cedula) public soloEnInscripcion {
        require(msg.sender == cne, "Solo el partido puede agregar militantes");
        padronPartido[cedula] = true;
    }

    function agregarCandidato(string memory nombre) public soloEnInscripcion {
        require(msg.sender == cne, "Solo el CNE puede agregar candidatos");
        candidatos.push(nombre);
    }

    function votar(string memory cedula, string memory candidato) public soloEnVotacion {
        require(registroCivil[cedula], "Cedula no valida en Registro Civil");
        require(padronCNE[cedula], "Sin derecho al voto segun CNE");
        require(padronPartido[cedula], "No es militante del partido");
        require(!yaVoto[cedula], "Ya votaste");
        yaVoto[cedula] = true;
        conteo[candidato] += 1;
    }

    function obtenerVotos(string memory candidato) public view returns (uint) {
        return conteo[candidato];
    }
}
